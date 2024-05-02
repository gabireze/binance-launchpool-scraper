# Binance Launchpool Scraper

This project contains an AWS Lambda function that scrapes updates from Binance Launchpool and sends notifications about new articles via a Telegram bot. It is scheduled to run every 6 hours to ensure updates are timely and relevant.

## Features

- **Data Scraping**: Automatically scrapes the latest articles from Binance Launchpool.
- **Telegram Notifications**: Sends updates to a specified Telegram chat using a bot.
- **AWS Lambda**: Deployed as an AWS Lambda function for reliable, scheduled execution.

## Prerequisites

Before you can use this project, you need to have the following:

- AWS account with access to Lambda, S3, and IAM permissions.
- Telegram bot token and chat ID.
- Node.js installed on your local machine for testing.

## Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/gabireze/binance-launchpool-scraper.git
   cd binance-launchpool-scraper
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a .env file in the root directory and fill in the following:

   ```plaintext
   TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
   TELEGRAM_CHAT_ID=<your-telegram-chat-id>
   AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
   AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
   AWS_REGION=<your-aws-region>
   AWS_S3_BUCKET=<your-aws-s3-bucket-name>
   ```

4. **Deploy to AWS Lambda:**

   Compress the project files into a ZIP archive.
   Upload the ZIP to AWS Lambda.
   Set the execution role with appropriate permissions.
   Configure the trigger to schedule the function every 6 hours.

## Usage

Once deployed, the Lambda function will automatically execute according to the schedule. You can monitor execution and logs via AWS CloudWatch.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues to suggest improvements or report bugs.

## License

This project is licensed under the ISC License - see the LICENSE.md file for details.
