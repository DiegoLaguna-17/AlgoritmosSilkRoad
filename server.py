from flask import Flask, request, jsonify
from sympy import symbols, laplace_transform, inverse_laplace_transform, LaplaceTransform
from sympy.integrals.transforms import InverseLaplaceTransform
from sympy.parsing.sympy_parser import parse_expr
from flask_cors import CORS
import traceback

app = Flask(__name__)
CORS(app)

t, s = symbols('t s')

@app.route('/laplace', methods=['POST'])
def calculate_laplace():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        if not data or 'expression' not in data:
            return jsonify({'error': 'Missing expression in request'}), 400
            
        expression_str = data['expression'].strip()
        if not expression_str:
            return jsonify({'error': 'Empty expression'}), 400

        expr = parse_expr(expression_str)
        L = laplace_transform(expr, t, s)
        
        if isinstance(L[0], LaplaceTransform):
            return jsonify({
                'error': f"Laplace transform cannot solve this expression: {expression_str}",
                'unsupported': True
            }), 400
            
        return jsonify({
            'result': str(L[0]),
            'condition': str(L[1])
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500

@app.route('/ilaplace', methods=['POST'])
def calculate_inverse_laplace():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        if not data or 'expression' not in data:
            return jsonify({'error': 'Missing expression in request'}), 400
            
        expression_str = data['expression'].strip()
        if not expression_str:
            return jsonify({'error': 'Empty expression'}), 400

        expr = parse_expr(expression_str)
        IL = inverse_laplace_transform(expr, s, t)
        
        # Check if the result is an unevaluated inverse transform
        if isinstance(IL, InverseLaplaceTransform):
            return jsonify({
                'error': f"Inverse Laplace cannot solve this expression: {expression_str}",
                'unsupported': True
            }), 400
            
        return jsonify({
            'result': str(IL)
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)