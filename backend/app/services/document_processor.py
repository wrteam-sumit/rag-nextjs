import os
import fitz  # PyMuPDF
import pdfplumber
from PIL import Image
import io
from typing import Dict, Any, Optional
import logging
import mammoth
import docx
import re

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        self.supported_extensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.mdx', '.rtf']
    
    def extract_text(self, file_path: str, file_content: bytes, file_extension: str) -> Dict[str, Any]:
        """
        Extract text from various document types
        """
        try:
            file_extension = file_extension.lower()
            
            if file_extension == '.pdf':
                return self._extract_pdf(file_content)
            elif file_extension == '.docx':
                return self._extract_docx(file_content)
            elif file_extension == '.doc':
                return self._extract_doc(file_content)
            elif file_extension in ['.txt', '.md', '.mdx']:
                return self._extract_text_file(file_content, file_extension)
            elif file_extension == '.rtf':
                return self._extract_rtf(file_content)
            else:
                return {
                    "text": "",
                    "method": "unsupported",
                    "success": False,
                    "error": f"Unsupported file type: {file_extension}"
                }
            
        except Exception as e:
            logger.error(f"Document processing failed: {str(e)}")
            return {
                "text": "",
                "method": "error",
                "success": False,
                "error": str(e)
            }
    
    def _extract_pdf(self, file_content: bytes) -> Dict[str, Any]:
        """Extract text from PDF using multiple methods"""
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
            
            # Method 3: Fallback - try to extract any readable patterns
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
    
    def _extract_docx(self, file_content: bytes) -> Dict[str, Any]:
        """Extract text from DOCX files"""
        try:
            # Try mammoth first
            result = mammoth.extract_raw_text(io.BytesIO(file_content))
            if result.value and len(result.value.strip()) > 50:
                return {
                    "text": result.value,
                    "method": "mammoth",
                    "success": True
                }
            
            # Fallback to python-docx
            doc = docx.Document(io.BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            if text.strip():
                return {
                    "text": text.strip(),
                    "method": "python-docx",
                    "success": True
                }
            
            return {
                "text": "",
                "method": "failed",
                "success": False,
                "error": "No readable text found in DOCX"
            }
            
        except Exception as e:
            logger.error(f"DOCX processing failed: {str(e)}")
            return {
                "text": "",
                "method": "error",
                "success": False,
                "error": str(e)
            }
    
    def _extract_doc(self, file_content: bytes) -> Dict[str, Any]:
        """Extract text from DOC files"""
        try:
            # Check if file content is empty
            if not file_content or len(file_content) == 0:
                return {
                    "text": "",
                    "method": "failed",
                    "success": False,
                    "error": "Empty file content received"
                }
            
            # Method 1: Try to decode as text first (some DOC files are actually text)
            text = file_content.decode('utf-8', errors='ignore')
            clean_text = self._clean_doc_text(text)
            if clean_text and len(clean_text.strip()) > 100:
                return {
                    "text": clean_text,
                    "method": "text-decode",
                    "success": True
                }
            
            # Method 2: Try mammoth for DOC files - convert bytes to BytesIO
            import io
            file_buffer = io.BytesIO(file_content)
            try:
                result = mammoth.extract_raw_text(file_buffer)
                if result.value and len(result.value.strip()) > 50:
                    clean_result = self._clean_doc_text(result.value)
                    if clean_result and len(clean_result.strip()) > 50:
                        return {
                            "text": clean_result,
                            "method": "mammoth-doc",
                            "success": True
                        }
            except Exception as mammoth_error:
                logger.warning(f"Mammoth failed for DOC: {str(mammoth_error)}")
            
            # Method 3: Advanced pattern extraction for binary DOC files
            text_patterns = self._extract_advanced_patterns(file_content)
            if text_patterns and len(text_patterns.strip()) > 50:
                return {
                    "text": text_patterns,
                    "method": "advanced-pattern-extraction",
                    "success": True
                }
            
            # Method 4: Try different encodings
            for encoding in ['latin-1', 'cp1252', 'iso-8859-1']:
                try:
                    text = file_content.decode(encoding, errors='ignore')
                    clean_text = self._clean_doc_text(text)
                    if clean_text and len(clean_text.strip()) > 50:
                        return {
                            "text": clean_text,
                            "method": f"text-decode-{encoding}",
                            "success": True
                        }
                except Exception as e:
                    continue
            
            return {
                "text": "",
                "method": "failed",
                "success": False,
                "error": f"No readable text found in DOC file (size: {len(file_content)} bytes). Please convert to DOCX or PDF format for better support."
            }
            
        except Exception as e:
            logger.error(f"DOC processing failed: {str(e)}")
            return {
                "text": "",
                "method": "error",
                "success": False,
                "error": str(e)
            }
    
    def _extract_text_file(self, file_content: bytes, file_extension: str) -> Dict[str, Any]:
        """Extract text from text files (TXT, MD, MDX)"""
        try:
            text = file_content.decode('utf-8', errors='ignore')
            
            if text.strip():
                return {
                    "text": text,
                    "method": f"text-{file_extension[1:]}",
                    "success": True
                }
            
            return {
                "text": "",
                "method": "failed",
                "success": False,
                "error": "Empty text file"
            }
            
        except Exception as e:
            logger.error(f"Text file processing failed: {str(e)}")
            return {
                "text": "",
                "method": "error",
                "success": False,
                "error": str(e)
            }
    
    def _extract_rtf(self, file_content: bytes) -> Dict[str, Any]:
        """Extract text from RTF files"""
        try:
            # Try mammoth for RTF - convert bytes to BytesIO
            import io
            file_buffer = io.BytesIO(file_content)
            try:
                result = mammoth.extract_raw_text(file_buffer)
                if result.value and len(result.value.strip()) > 50:
                    return {
                        "text": result.value,
                        "method": "mammoth-rtf",
                        "success": True
                    }
            except Exception as mammoth_error:
                logger.warning(f"Mammoth failed for RTF: {str(mammoth_error)}")
            
            # Fallback: decode as text and clean
            text = file_content.decode('utf-8', errors='ignore')
            clean_text = self._clean_rtf_text(text)
            
            if clean_text and len(clean_text.strip()) > 100:
                return {
                    "text": clean_text,
                    "method": "text-fallback",
                    "success": True
                }
            
            return {
                "text": "",
                "method": "failed",
                "success": False,
                "error": "No readable text found in RTF"
            }
            
        except Exception as e:
            logger.error(f"RTF processing failed: {str(e)}")
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
    
    def _extract_patterns(self, file_content: bytes) -> str:
        """Extract readable text patterns from raw data"""
        try:
            content = file_content.decode('utf-8', errors='ignore')
            
            # Look for readable text patterns
            patterns = re.findall(r'[A-Za-z0-9\s\.\,\!\?\:\;\-\(\)\[\]\{\}]{20,}', content)
            
            if patterns:
                return " ".join(patterns)
            return ""
        except Exception as e:
            logger.warning(f"Pattern extraction failed: {str(e)}")
            return ""
    
    def _clean_doc_text(self, text: str) -> str:
        """Clean DOC file text"""
        import re
        
        # Remove binary data patterns
        text = re.sub(r'[A-Za-z0-9]{20,}[A-Za-z0-9\s]{50,}', '', text)  # Remove long binary sequences
        text = re.sub(r'[A-Za-z0-9]{10,}[^\w\s]{5,}[A-Za-z0-9]{10,}', '', text)  # Remove mixed binary patterns
        
        # Remove common binary patterns
        text = re.sub(r'[A-Za-z0-9]{8,}[A-Za-z0-9\s]{20,}[A-Za-z0-9]{8,}', '', text)
        text = re.sub(r'[A-Za-z0-9]{5,}[^\w\s]{3,}[A-Za-z0-9]{5,}', '', text)
        
        # Remove non-printable characters
        text = re.sub(r'[^\x20-\x7E\n\r\t]', '', text)
        
        # Replace multiple spaces with single space
        text = re.sub(r'\s+', ' ', text)
        
        # Remove empty lines
        text = re.sub(r'\n\s*\n', '\n', text)
        
        # Remove Word metadata and binary artifacts
        text = re.sub(r'Microsoft Word|Word Document|Document Object|Object\s+Stream|Root Entry|FhiData|WordDocument|CompObj|Biff8|Excel\.Sheet|PNG IHDR|JPEG|GIF|BMP|TIFF', '', text, flags=re.IGNORECASE)
        
        # Remove binary data patterns
        text = re.sub(r'[A-Za-z0-9]{15,}', '', text)  # Remove very long alphanumeric sequences
        
        # Keep only readable text with proper punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\:\;\-\(\)\[\]\{\}\"\']', ' ', text)
        
        # Clean up extra spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Remove lines that are mostly binary data
        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if len(line) > 0:
                # Check if line has enough readable content
                readable_chars = len(re.findall(r'[A-Za-z]', line))
                total_chars = len(line)
                if total_chars > 0 and readable_chars / total_chars > 0.3:  # At least 30% readable
                    cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines).strip()
    
    def _clean_rtf_text(self, text: str) -> str:
        """Clean RTF file text"""
        # Remove RTF control words
        text = re.sub(r'\\[a-z0-9-]+\d*', '', text)
        text = re.sub(r'\\[a-z0-9-]+', '', text)
        text = re.sub(r'\{[^}]*\}', '', text)
        text = re.sub(r'[^\x20-\x7E\n\r\t]', '', text)
        return text.strip()
    
    def get_metadata(self, file_content: bytes, file_extension: str) -> Dict[str, Any]:
        """Extract document metadata"""
        try:
            if file_extension.lower() == '.pdf':
                doc = fitz.open(stream=file_content, filetype="pdf")
                metadata = doc.metadata
                doc.close()
                return metadata
            else:
                return {
                    "file_type": file_extension,
                    "processing_method": "text_extraction"
                }
        except Exception as e:
            logger.warning(f"Metadata extraction failed: {str(e)}")
            return {}
    
    def _extract_text_patterns(self, file_content: bytes) -> str:
        """Extract text patterns from binary content for DOC files"""
        try:
            # Try to find readable text patterns in binary data
            text = file_content.decode('utf-8', errors='ignore')
            
            # Remove non-printable characters and clean up
            import re
            text = re.sub(r'[^\x20-\x7E\n\r\t]', '', text)
            text = re.sub(r'\s+', ' ', text)
            
            # Look for common document patterns
            patterns = [
                r'[A-Za-z0-9\s]{20,}',  # Long sequences of letters/numbers
                r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*',  # Title case words
                r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',  # Dates
                r'[A-Za-z]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',  # Email addresses
            ]
            
            extracted_text = ""
            for pattern in patterns:
                matches = re.findall(pattern, text)
                if matches:
                    extracted_text += " ".join(matches) + " "
            
            return extracted_text.strip()
        except Exception as e:
            logger.error(f"Text pattern extraction failed: {str(e)}")
            return ""
    
    def _extract_advanced_patterns(self, file_content: bytes) -> str:
        """Advanced pattern extraction for binary DOC files"""
        try:
            import re
            
            # Try multiple encodings
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            best_text = ""
            
            for encoding in encodings:
                try:
                    text = file_content.decode(encoding, errors='ignore')
                    
                    # Remove binary patterns
                    text = re.sub(r'[A-Za-z0-9]{20,}', '', text)  # Remove long binary sequences
                    text = re.sub(r'[^\x20-\x7E\n\r\t]', '', text)  # Remove non-printable
                    
                    # Extract readable sentences
                    sentences = re.findall(r'[A-Z][^.!?]*[.!?]', text)
                    paragraphs = re.findall(r'[A-Z][^.!?]*[.!?]\s*[A-Z][^.!?]*[.!?]', text)
                    
                    # Combine sentences and paragraphs
                    readable_text = " ".join(sentences + paragraphs)
                    
                    # Clean up
                    readable_text = re.sub(r'\s+', ' ', readable_text)
                    readable_text = re.sub(r'[^\w\s\.\,\!\?\:\;\-\(\)\[\]\{\}\"\']', ' ', readable_text)
                    
                    if len(readable_text.strip()) > len(best_text.strip()):
                        best_text = readable_text
                        
                except Exception as e:
                    continue
            
            return best_text.strip()
        except Exception as e:
            logger.error(f"Advanced pattern extraction failed: {str(e)}")
            return "" 