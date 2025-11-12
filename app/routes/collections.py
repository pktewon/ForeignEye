"""
컬렉션 API 라우트

개념 수집, 수집 취소, 내 컬렉션 조회 API
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.utils.response import success_response, error_response
from app.utils.exceptions import NotFoundError, DuplicateEntryError, ValidationError
from app.utils.validators import validate_concept_id, validate_sort_params
from app.extensions import limiter
from app.services.collection_service import CollectionService

bp = Blueprint('collections', __name__)


@bp.route('/concepts', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def collect_concept():
    """
    개념 수집 API (JWT)
    
    POST /api/v1/collections/concepts
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        concept_id = validate_concept_id(data.get('concept_id'))
        
        # 서비스 호출
        result = CollectionService.collect_concept(user_id, concept_id)
        
        return success_response({
            'collection': result['collection'].to_dict(),
            'concept_name': result['concept_name'],
            'new_connections': result['new_connections'],
            'message': f"'{result['concept_name']}'를 수집했습니다!" + (
                f" {len(result['new_connections'])}개의 강한 연결을 발견했습니다."
                if result['new_connections'] else ""
            )
        }, status=201)
        
    except (ValidationError, NotFoundError, DuplicateEntryError) as e:
        raise
    except Exception as e:
        return error_response('INTERNAL_ERROR', str(e), 500)


@bp.route('/concepts/<int:concept_id>', methods=['DELETE'])
@jwt_required()
def remove_concept(concept_id):
    """
    개념 수집 취소 API (JWT)
    
    DELETE /api/v1/collections/concepts/{concept_id}
    """
    try:
        user_id = get_jwt_identity()
        # 서비스 호출
        concept_name = CollectionService.remove_collection(
            user_id,
            concept_id
        )
        
        return success_response({
            'concept_id': concept_id,
            'message': f"'{concept_name}'를 컬렉션에서 제거했습니다."
        })
        
    except NotFoundError as e:
        raise
    except Exception as e:
        return error_response('INTERNAL_ERROR', str(e), 500)


@bp.route('/concepts', methods=['GET'])
@jwt_required()
def get_collections():
    """
    내 컬렉션 조회 API (JWT)
    
    GET /api/v1/collections/concepts?sort=collected_at&order=desc
    """
    try:
        user_id = get_jwt_identity()
        sort = request.args.get('sort', 'collected_at')
        order = request.args.get('order', 'desc')
        
        # 검증
        sort, order = validate_sort_params(sort, order, ['collected_at', 'name'])
        
        # 서비스 호출
        concepts = CollectionService.get_user_collections(
            user_id,
            sort,
            order
        )
        
        return success_response({
            'concepts': [c.to_dict() for c in concepts],
            'total_concepts': len(concepts)
        })
        
    except ValidationError as e:
        raise
    except Exception as e:
        return error_response('INTERNAL_ERROR', str(e), 500)

