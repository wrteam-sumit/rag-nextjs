#!/bin/bash

# RAG Backend Redeployment Script
echo "🚀 RAG Backend Redeployment Script"
echo "=================================="

echo ""
echo "📋 Fixed Issues:"
echo "✅ Fixed trafilatura dependency version (7.0.0 → 6.0.0)"
echo "✅ Switched from Poetry to pip for more reliable deployment"
echo "✅ Updated render.yaml configuration"
echo "✅ Created requirements.txt as backup"

echo ""
echo "🔧 Deployment Steps:"
echo "1. Commit and push the changes:"
echo "   git add ."
echo "   git commit -m 'Fix backend dependencies and deployment'"
echo "   git push origin main"

echo ""
echo "2. Redeploy on Render:"
echo "   - Go to https://dashboard.render.com"
echo "   - Find your 'rag-backend' service"
echo "   - Click 'Manual Deploy' → 'Deploy latest commit'"
echo "   - Or trigger a new deployment from GitHub"

echo ""
echo "3. Monitor the build:"
echo "   - Watch the build logs for any errors"
echo "   - Should see 'Successfully installed' messages"
echo "   - Wait for service to start (2-3 minutes)"

echo ""
echo "4. Test the deployment:"
echo "   - Health check: https://rag-backend.onrender.com/health"
echo "   - Root endpoint: https://rag-backend.onrender.com/"
echo "   - Test endpoint: https://rag-backend.onrender.com/test"

echo ""
echo "🔍 Expected Build Output:"
echo "✅ pip install --upgrade pip"
echo "✅ pip install -r requirements.txt"
echo "✅ Successfully installed [all packages]"
echo "✅ Starting uvicorn app.main_simple:app"

echo ""
echo "⚠️  If build still fails:"
echo "- Check Render logs for specific error messages"
echo "- Verify all dependencies in requirements.txt are compatible"
echo "- Consider removing problematic dependencies temporarily"

echo ""
echo "✅ Ready to redeploy!"
