import os
import fitz  # PyMuPDF
import pdfplumber
from PIL import Image
import io
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self):
        self.supported_extensions = ['.pdf']
    
    def extract_text(self, file_path: str, file_content: bytes) -> Dict[str, Any]:
        """
        Extract text from PDF using multiple methods for better results
        """
        try:
            # Method 1: Try pdfplumber first (best for text-based PDFs)
            text = self._extract_with_pdfplumber(file_content)
            if text and len(text.strip()) > 100:
                return {
                    "text": text,
                    "method": "pdfplumber",
                    "success": True
                }
            
            # Method 2: Try PyMuPDF (fitz)
            text = self._extract_with_pymupdf(file_content)
            if text and len(text.strip()) > 100:
                return {
                    "text": text,
                    "method": "pymupdf",
                    "success": True
                }
            
            # Method 3: OCR for image-based PDFs (disabled - requires tesseract)
            # text = self._extract_with_ocr(file_path)
            # if text and len(text.strip()) > 100:
            #     return {
            #         "text": text,
            #         "method": "ocr",
            #         "success": True
            #     }
            
            # Method 4: Fallback - try to extract any readable patterns
            text = self._extract_patterns(file_content)
            if text and len(text.strip()) > 50:
                return {
                    "text": text,
                    "method": "pattern_extraction",
                    "success": True
                }
            
            return {
                "text": "",
                "method": "failed",
                "success": False,
                "error": "No readable text found in PDF"
            }
            
        except Exception as e:
            logger.error(f"PDF processing failed: {str(e)}")
            return {
                "text": "",
                "method": "error",
                "success": False,
                "error": str(e)
            }
    
    def _extract_with_pdfplumber(self, file_content: bytes) -> str:
        """Extract text using pdfplumber"""
        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                return text.strip()
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed: {str(e)}")
            return ""
    
    def _extract_with_pymupdf(self, file_content: bytes) -> str:
        """Extract text using PyMuPDF"""
        try:
            doc = fitz.open(stream=file_content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text.strip()
        except Exception as e:
            logger.warning(f"PyMuPDF extraction failed: {str(e)}")
            return ""
    
    def _extract_with_ocr(self, file_path: str) -> str:
        """Extract text using OCR (requires tesseract)"""
        # OCR functionality disabled - requires tesseract and pdf2image
        logger.warning("OCR extraction disabled - requires tesseract and pdf2image")
        return ""
    
    def _extract_patterns(self, file_content: bytes) -> str:
        """Extract readable text patterns from raw PDF data"""
        try:
            content = file_content.decode('utf-8', errors='ignore')
            
            # Look for readable text patterns
            import re
            patterns = re.findall(r'[A-Za-z0-9\s\.\,\!\?\:\;\-\(\)\[\]\{\}]{20,}', content)
            
            if patterns:
                return " ".join(patterns)
            return ""
        except Exception as e:
            logger.warning(f"Pattern extraction failed: {str(e)}")
            return ""
    
    def get_metadata(self, file_content: bytes) -> Dict[str, Any]:
        """Extract PDF metadata"""
        try:
            doc = fitz.open(stream=file_content, filetype="pdf")
            metadata = doc.metadata
            doc.close()
            return metadata
        except Exception as e:
            logger.warning(f"Metadata extraction failed: {str(e)}")
            return {} 