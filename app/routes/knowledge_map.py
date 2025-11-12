"""
지식 맵 API 라우트

통합 지식 맵 조회, 개념 추천 API
"""

from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.utils.response import success_response, error_response
from app.services.graph_service import GraphService

bp = Blueprint('knowledge_map', __name__)


@bp.route('', methods=['GET'])
@jwt_required()

def get_knowledge_map():
    """
    통합 지식 맵 조회 API (Dashboard)
    
    GET /api/v1/knowledge-map
    """
    user_id = get_jwt_identity()
    try:
        # 서비스 호출
        result = GraphService.get_knowledge_map_for_user(user_id)
        
        return success_response(result)
        
    except Exception as e:
        return error_response('INTERNAL_ERROR', str(e), 500)

