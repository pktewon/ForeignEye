"""
AI 분석기

OpenRouter API를 사용하여 기사를 분석하고 개념을 추출합니다.
"""

import os
import json
import re
from typing import Optional, Dict
from openai import OpenAI


class AIAnalyzer:
    """AI 기반 기사 분석 클래스"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "anthropic/claude-3-haiku"):
        """
        Args:
            api_key (str, optional): OpenRouter API 키. None이면 환경 변수에서 로드
            model (str): 사용할 AI 모델 (기본값: claude-3-haiku)
        """
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY')
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found. Please set it in .env file.")
        
        self.model = model
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key,
            default_headers={
                "HTTP-Referer": "https://techexplained.project",
                "X-Title": "TechExplained Project"
            }
        )
    
    def analyze_article(self, article_text: str) -> Optional[Dict]:
        """
        기사 분석 및 개념 추출
        
        Args:
            article_text (str): 분석할 기사 텍스트
            
        Returns:
            dict: {
                'title_ko': str,
                'summary_ko': str,
                'concept_names': [str]
            } or None on failure
        """
        # 입력 검증
        if not article_text or len(article_text.strip()) < 100:
            print(f"     ✗ Article text too short (length: {len(article_text) if article_text else 0})")
            return None
        
        # 프롬프트 생성
        prompt = self._build_prompt(article_text)
        
        try:
            print("     ⟳ Sending request to OpenRouter AI...")
            print(f"     → Model: {self.model}")
            print(f"     → Article length: {len(article_text)} chars")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.5,
                max_tokens=3000
            )
            
            if not response or not response.choices:
                print("     ✗ Empty response from OpenRouter API")
                return None
            
            ai_response = response.choices[0].message.content.strip()
            print(f"     ✓ Received response ({len(ai_response)} chars)")
            
            # JSON 파싱
            analysis_result = self._parse_response(ai_response)

            if analysis_result:
                print(f"     ✓ AI analysis complete!")
                print(f"     ✓ Title (ko): {analysis_result['title_ko'][:50]}...")
                print(f"     ✓ Summary length: {len(analysis_result['summary_ko'])} chars")
                print(f"     ✓ Concepts detected: {len(analysis_result['concept_names'])}")

            return analysis_result
        
        except Exception as e:
            print(f"     ✗ Error during AI analysis: {type(e).__name__}: {e}")
            return None
    
    def _build_prompt(self, article_text: str) -> str:
        """
        AI 분석 프롬프트 생성
        
        Args:
            article_text (str): 기사 텍스트
            
        Returns:
            str: 프롬프트
        """
        # 텍스트 길이 제한 (3000자)
        truncated_text = article_text[:3000]
        
        prompt = f"""
You are 'TechExplained', an expert technology scout.
Analyse the news article below and return ONLY a valid JSON object. No commentary, markdown, or extra text.

Your tasks:
1. Translate the article title into natural Korean (title_ko).
2. Provide a detailed Korean summary in 3-5 sentences that captures the article's key developments, 주요 인물/기업, 그리고 영향 (summary_ko).
3. List up to five distinct technology-related concepts that are explicitly mentioned in the article. Provide only their canonical names (prefer English terms). Do not invent new concepts. Output them as an array "concept_names".

Article text:
{truncated_text}

Return JSON exactly in this shape:
{{
  "title_ko": "한국어 제목",
  "summary_ko": "한국어 요약",
  "concept_names": ["Concept 1", "Concept 2"]
}}

Important rules:
- Respond with JSON only.
- If fewer than five valid concepts exist, return only the ones that are explicitly mentioned.
- Remove duplicates and keep the order they appear in the article.
"""
        
        return prompt
    
    def _parse_response(self, ai_response: str) -> Optional[Dict]:
        """
        AI 응답 파싱
        
        Args:
            ai_response (str): AI 응답 텍스트
            
        Returns:
            dict: 파싱된 분석 결과. 실패 시 None
        """
        # 방법 1: 직접 JSON 파싱
        try:
            analysis_result = json.loads(ai_response)
            print(f"     ✓ Direct JSON parse successful!")
            return self._validate_analysis(analysis_result)
        except json.JSONDecodeError:
            print("     → Direct parse failed, trying regex extraction...")
        
        # 방법 2: 정규식으로 JSON 추출
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        
        if not json_match:
            print(f"     ✗ No JSON object found in AI response")
            self._save_debug_response(ai_response)
            return None
        
        json_string = json_match.group(0)
        
        try:
            analysis_result = json.loads(json_string)
            return self._validate_analysis(analysis_result)
        
        except json.JSONDecodeError as e:
            print(f"     ✗ Failed to parse JSON: {e}")
            self._save_debug_response(json_string, prefix="debug_json")
            return None
    
    def _validate_analysis(self, analysis: Dict) -> Optional[Dict]:
        """
        분석 결과 검증
        
        Args:
            analysis (dict): 분석 결과
            
        Returns:
            dict: 검증된 결과. 실패 시 None
        """
        required_fields = ['title_ko', 'summary_ko', 'concept_names']
        missing_fields = [field for field in required_fields if field not in analysis]
        
        if missing_fields:
            print(f"     ✗ Missing required fields: {missing_fields}")
            return None
        
        if not isinstance(analysis.get('concept_names'), list):
            print("     ✗ 'concept_names' must be a list")
            return None
        
        # concept_names 정리
        cleaned_names = []
        for name in analysis['concept_names']:
            if isinstance(name, str):
                name = name.strip()
                if name:
                    cleaned_names.append(name)
        
        if not cleaned_names:
            print("     ✗ No valid concept names found")
            return None
        
        seen = set()
        unique_names = []
        for name in cleaned_names:
            if name not in seen:
                seen.add(name)
                unique_names.append(name)
            if len(unique_names) == 5:
                break

        analysis['concept_names'] = unique_names

        return analysis
    
    def _save_debug_response(self, content: str, prefix: str = "debug_response"):
        """
        디버그용으로 응답 저장
        
        Args:
            content (str): 저장할 내용
            prefix (str): 파일명 접두사
        """
        try:
            filename = f'{prefix}.txt'
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"     → Debug response saved to {filename}")
        except Exception:
            pass

