# Vercel Deployment Guide

This guide explains how to deploy this monorepo application to Vercel.

## Prerequisites

- A Vercel account
- Git repository connected to Vercel
- Vercel CLI (optional for local testing)

## Steps to Deploy

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

2. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com/) and sign in
   - Click "Add New" → "Project"
   - Import your Git repository
   - Select the repository that contains this project

3. **Configure the project**
   - Framework Preset: Select "Other"
   - Root Directory: Leave as default (the root of your repo)
   - Build Command: Leave empty (will use the one from vercel.json)
   - Output Directory: Leave empty (will use the one from vercel.json)

4. **Environment Variables**
   - Add all required environment variables from your local .env files
   - Make sure to include all API keys and endpoints needed by both frontend and backend
   
   Required variables:
   - All variables from your frontend/.env file (with VITE_ prefix)
   - All variables from your backend/.env file

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application according to the vercel.json configuration

## After Deployment

1. **Verify API Connection**
   - Check that the frontend can communicate with the backend API
   - If there are CORS issues, verify the CORS configuration in your backend

2. **Custom Domain (Optional)**
   - Go to "Settings" → "Domains"
   - Add your custom domain if needed

3. **Monitoring**
   - Monitor your application using Vercel's built-in analytics
   - Check logs for any issues

## Updating Your Deployment

- Any new pushes to your Git repository's main branch will automatically trigger a new deployment
- You can also manually redeploy from the Vercel dashboard

## Troubleshooting

- If the API is not working, check the Functions log in the Vercel dashboard
- If the frontend can't connect to the API, verify the API URL configuration in the frontend code
- Check that all environment variables are correctly set in Vercel 