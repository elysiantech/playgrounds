# Playgrounds App
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/elysiantech/playgrounds)

Playgrounds is an interactive application that enables users to generate, manage, and enhance images with advanced customization tools.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/elysiantech/playgrounds.git
   cd playgrounds
   ```

2. Install dependencies:
   ```bash
   npm install
   brew install ngrok
   ```

3. Set up environment variables in a `.env` file:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NGROK_DOMAIN=
   ```
   requires ngrok account to get static domain, for debugging webhooks

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

### **Generate Images**
1. Enter a prompt in the textarea.
2. Adjust creativity and steps using sliders.
3. Click "Generate" to create a new image.

### **Manage Images**
- Click on a generated image to select it.
- Use tools (Reimagine, Upscale, Make 3D, Info, Download, Delete) to interact with the image.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Acknowledgements

- **NextAuth.js** for authentication.
- **lucide-react** for icons.
- **Tailwind CSS** for styling.
- **React** and **Next.js** for frameworks
