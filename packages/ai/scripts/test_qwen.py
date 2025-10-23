#!/usr/bin/env python3
"""
Test script for qwen_analyzer.py
"""

import json
import subprocess
import sys
from pathlib import Path

def test_qwen_analyzer():
    """Test the qwen_analyzer binary"""

    # Check if binary exists
    binary_path = Path("../dist/qwen_analyzer")
    if not binary_path.exists():
        print("❌ qwen_analyzer binary not found. Please build it first.")
        return False

    # Test with invalid arguments
    print("🧪 Testing with invalid arguments...")
    try:
        result = subprocess.run(
            [str(binary_path), "--help"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            print("✅ Help command works")
        else:
            print("❌ Help command failed")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Command timed out")
        return False
    except Exception as e:
        print(f"❌ Error running help command: {e}")
        return False

    # Test with missing required arguments
    print("🧪 Testing with missing arguments...")
    try:
        result = subprocess.run(
            [str(binary_path)],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode != 0:
            print("✅ Correctly handles missing arguments")
        else:
            print("❌ Should have failed with missing arguments")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Command timed out")
        return False
    except Exception as e:
        print(f"❌ Error testing missing arguments: {e}")
        return False

    print("✅ All tests passed!")
    return True

if __name__ == "__main__":
    success = test_qwen_analyzer()
    sys.exit(0 if success else 1)
