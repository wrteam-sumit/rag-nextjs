#!/usr/bin/env python3
"""
Test script for the Multi-Agent RAG System
This script tests domain detection, web search, and response generation
"""

import asyncio
import requests
import json
import sys
import os
from typing import Dict, Any

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_mcp_server():
    """Test MCP server functionality"""
    print("🔍 Testing MCP Server...")
    
    try:
        # Test health endpoint
        response = requests.get("http://localhost:3001/health", timeout=5)
        if response.status_code == 200:
            print("✅ MCP Server is running")
        else:
            print("❌ MCP Server health check failed")
            return False
        
        # Test search engines endpoint
        response = requests.get("http://localhost:3001/engines", timeout=5)
        if response.status_code == 200:
            engines = response.json()
            print(f"✅ Available search engines: {len(engines.get('engines', []))}")
        else:
            print("❌ Failed to get search engines")
            return False
        
        # Test web search
        search_data = {
            "query": "artificial intelligence",
            "max_results": 3,
            "search_engine": "duckduckgo"
        }
        
        response = requests.post(
            "http://localhost:3001/search",
            json=search_data,
            timeout=10
        )
        
        if response.status_code == 200:
            results = response.json()
            print(f"✅ Web search successful: {results.get('total_results', 0)} results")
            return True
        else:
            print(f"❌ Web search failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ MCP Server is not running. Start it with: ./run-mcp-server.sh")
        return False
    except Exception as e:
        print(f"❌ MCP Server test failed: {str(e)}")
        return False

def test_backend_api():
    """Test backend API functionality"""
    print("\n🔍 Testing Backend API...")
    
    try:
        # Test domains endpoint
        response = requests.get("http://localhost:8000/api/query/domains", timeout=5)
        if response.status_code == 200:
            domains = response.json()
            print(f"✅ Available domains: {len(domains.get('domains', []))}")
            for domain in domains.get('domains', []):
                print(f"   - {domain['name']}: {domain['description']}")
        else:
            print("❌ Failed to get domains")
            return False
        
        # Test query endpoint with different domains
        test_queries = [
            {
                "question": "What are the symptoms of diabetes?",
                "domain": "health",
                "description": "Health domain test"
            },
            {
                "question": "How to improve soil fertility for farming?",
                "domain": "agriculture", 
                "description": "Agriculture domain test"
            },
            {
                "question": "What are the latest developments in quantum computing?",
                "domain": "general",
                "description": "General domain with web search test"
            }
        ]
        
        for test in test_queries:
            print(f"\n🧪 Testing: {test['description']}")
            
            query_data = {
                "question": test["question"],
                "domain": test["domain"],
                "use_web_search": True
            }
            
            response = requests.post(
                "http://localhost:8000/api/query/",
                json=query_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Query successful")
                print(f"   Domain: {result.get('domain_name', 'Unknown')}")
                print(f"   Model: {result.get('model_used', 'Unknown')}")
                print(f"   Web search used: {result.get('web_search_used', False)}")
                print(f"   Answer length: {len(result.get('answer', ''))} characters")
            else:
                print(f"❌ Query failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown error')}")
                except:
                    print(f"   Error: {response.text}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Backend API is not running. Start it with: ./run-backend.sh")
        return False
    except Exception as e:
        print(f"❌ Backend API test failed: {str(e)}")
        return False

def test_domain_detection():
    """Test domain detection functionality"""
    print("\n🔍 Testing Domain Detection...")
    
    try:
        from backend.app.services.multi_agent_service import MultiAgentService, AgentDomain
        
        service = MultiAgentService()
        
        test_cases = [
            ("What are the symptoms of heart disease?", "health"),
            ("How to grow organic tomatoes?", "agriculture"),
            ("What are the legal requirements for starting a business?", "legal"),
            ("How to invest in stocks?", "finance"),
            ("What are effective study techniques?", "education"),
            ("What is the weather like today?", "general")
        ]
        
        for question, expected_domain in test_cases:
            detected_domain = service.detect_domain(question)
            status = "✅" if detected_domain.value == expected_domain else "❌"
            print(f"{status} '{question}' -> {detected_domain.value} (expected: {expected_domain})")
        
        return True
        
    except ImportError:
        print("❌ Could not import MultiAgentService. Make sure backend is properly set up.")
        return False
    except Exception as e:
        print(f"❌ Domain detection test failed: {str(e)}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Multi-Agent RAG System Test Suite")
    print("=" * 50)
    
    # Test MCP Server
    mcp_ok = test_mcp_server()
    
    # Test Backend API
    backend_ok = test_backend_api()
    
    # Test Domain Detection
    detection_ok = test_domain_detection()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"   MCP Server: {'✅ PASS' if mcp_ok else '❌ FAIL'}")
    print(f"   Backend API: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"   Domain Detection: {'✅ PASS' if detection_ok else '❌ FAIL'}")
    
    if all([mcp_ok, backend_ok, detection_ok]):
        print("\n🎉 All tests passed! The multi-agent system is working correctly.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please check the setup and try again.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
