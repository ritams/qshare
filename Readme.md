# QShare

QShare is a simple app to share files over local network.

## Usage

1. Run `bun start` to start the server.
2. Open http://localhost:3000 in your browser.
3. Select the files you want to share and click "Share".
4. The page will display a QR code. Scan it with your mobile device to download the files.

## Dependencies

- archiver
- express
- express-fileupload
- qrcode