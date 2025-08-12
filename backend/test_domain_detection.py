#!/usr/bin/env python3
"""
Test script to debug domain detection
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.services.multi_agent_service import MultiAgentService, AgentDomain

def test_domain_detection():
    print("🔍 Testing Domain Detection...")
    
    service = MultiAgentService()
    
    test_cases = [
        ("What are the symptoms of diabetes?", "health"),
        ("How to grow organic tomatoes?", "agriculture"),
        ("What are the legal requirements for starting a business?", "legal"),
        ("How to invest in stocks?", "finance"),
        ("What are effective study techniques?", "education"),
        ("What is the weather like today?", "general")
    ]
    
    for question, expected_domain in test_cases:
        print(f"\n🧪 Testing: '{question}'")
        
        # Test the detection
        detected_domain = service.detect_domain(question)
        
        # Debug: Show the scoring process
        text = question.lower()
        print(f"   Text: {text}")
        
        domain_scores = {}
        for domain, config in service.domain_configs.items():
            if domain == AgentDomain.GENERAL:
                continue
            
            keywords = config.get("keywords", [])
            matches = [k for k in keywords if k in text]
            score = len(matches) / len(keywords) if keywords else 0
            
            domain_scores[domain] = score
            print(f"   {domain.value}: {len(matches)}/{len(keywords)} matches = {score:.3f}")
        
        # Find best domain
        if domain_scores:
            best_domain = max(domain_scores.items(), key=lambda x: x[1])
            print(f"   Best domain: {best_domain[0].value} (score: {best_domain[1]:.3f})")
            print(f"   Threshold: 0.1")
            print(f"   Would detect: {best_domain[1] > 0.1}")
        
        # Final result
        status = "✅" if detected_domain.value == expected_domain else "❌"
        print(f"   {status} Detected: {detected_domain.value} (expected: {expected_domain})")

if __name__ == "__main__":
    test_domain_detection()
