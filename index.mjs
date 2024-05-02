import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import chromium from "@sparticuz/chromium";
import * as dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import puppeteer from "puppeteer-core";

dotenv.config();

const url = "https://www.binance.com/en/support/search?type=1&q=Launchpool";
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const chatId = process.env.TELEGRAM_CHAT_ID;

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.AWS_S3_BUCKET;

async function getCurrentISODate() {
  return new Date().toISOString();
}

async function getSentArticles() {
  try {
    const data = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: "sentArticles.json",
      })
    );
    const bodyContents = await streamToString(data.Body);
    return JSON.parse(bodyContents);
  } catch (error) {
    if (error.name === "NoSuchKey") {
      return [];
    } else {
      throw error;
    }
  }
}

async function updateSentArticles(articles) {
  const buffer = Buffer.from(JSON.stringify(articles, null, 2));
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: "sentArticles.json",
      Body: buffer,
      ContentType: "application/json",
    },
  });

  upload.on("httpUploadProgress", (progress) => {
    console.log(progress);
  });

  await upload.done();
}

async function scrapeData() {
  console.log("Starting scraping...");
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      headless: true,
      args: chromium.args,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    const articles = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".css-1h690ep"));
      return items.map((item) => {
        const titleElement = item.querySelector('[id^="supportSearch-list"]');
        const title = titleElement
          ? titleElement.textContent.trim()
          : "No title found";
        const date = item.querySelector(".css-o3lq0a")?.textContent.trim();
        return { title, date };
      });
    });

    const sentArticles = await getSentArticles();
    const newArticles = articles.filter(
      (article) =>
        article.title.startsWith("Introducing") &&
        !sentArticles.some(
          (a) => a.title === article.title && a.date === article.date
        )
    );

    for (const article of newArticles) {
      console.log("Sending new article.");
      await bot.sendMessage(
        chatId,
        `Title: ${article.title}\nDate: ${article.date}`
      );
      sentArticles.push({
        title: article.title,
        date: article.date,
        sentOn: await getCurrentISODate(),
      });
    }

    await updateSentArticles(sentArticles);

    if (newArticles.length === 0) {
      console.log("No new articles to send since last check.");
    }
  } catch (error) {
    console.error("An error occurred during scraping:", error.message);
    throw error; // Rethrowing the error to make sure it is logged in CloudWatch
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export const handler = async (event, context) => {
  try {
    await scrapeData();
  } catch (error) {
    console.error("Failed to execute handler:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to process request",
        details: error.message,
      }),
    };
  }
};

// Helper function to convert a ReadableStream to a string
async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}
