#!/bin/bash
# GitHub Repository Connection Script
# Repository: https://github.com/3bsolutionsltd/transconnect-app.git

echo "🔗 Connecting to TransConnect GitHub Repository..."
echo "================================================"
echo "Repository: 3bsolutionsltd/transconnect-app"
echo ""

REPO_URL="https://github.com/3bsolutionsltd/transconnect-app.git"

echo "📡 Adding GitHub remote..."
git remote add origin "$REPO_URL" 2>/dev/null || {
    echo "🔄 Remote already exists, updating URL..."
    git remote set-url origin "$REPO_URL"
}

echo "🚀 Pushing develop branch..."
if ! git push -u origin develop; then
    echo "❌ Error pushing develop branch. Please check repository permissions."
    exit 1
fi

echo "🌟 Creating main branch..."
git checkout -b main
git push -u origin main

echo "🔄 Switching back to develop..."
git checkout develop

echo "✅ GitHub repository setup complete!"
echo ""
echo "🎉 Your repository is now live at:"
echo "   ${REPO_URL%.git}"
echo ""
echo "🚀 Next Steps:"
echo "1. Deploy backend to Render"
echo "2. Deploy frontend to Vercel"
echo "3. Configure production environment variables"
echo ""
echo "Happy deploying! 🚀"