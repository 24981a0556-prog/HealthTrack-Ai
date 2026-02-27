# Problem statement:AI-Based Medical Report Simplifier

# Solution:Intelligent Medical Report Interpreter with Risk Highlighting and Personalized Action Suggestions with Long-term health monitoring system

# Features:
1.Image/pdf to report analysis

2.Risk analysis(low,medim,high)

3.Action suggestions

4.Health report expiry tracking

5.Gamified remainders(streaks,leader board)

# Tech stack and tools used:
Frontend + Backend → Lovable

OCR → Google Vision API

AI → Claude / OpenAI

Database → Lovable DB

Scheduler → Loavble backend workflows

Email → SendGrid

Charts → Lovable plugin

# architecture

User → Web App (UI)
  
   ↓

File Upload (Storage)

      ↓

OCR Extraction
        
               ↓
        
Risk Engine (Rules + Weights)

        ↓
        
AI Layer (Explanation + Action Plan)

        ↓
        
Database (User Health Timeline)

        ↓
        
Scheduler (Expiry + Reminders)

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

Simply open Vercel connect your Github repo and click deploy.so,that ur website will be deployed on a single click

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
