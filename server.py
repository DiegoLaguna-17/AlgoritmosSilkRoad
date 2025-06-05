from flask import Flask, request, jsonify, send_file
from sympy import symbols, laplace_transform, inverse_laplace_transform, LaplaceTransform
from sympy.integrals.transforms import InverseLaplaceTransform
from sympy.parsing.sympy_parser import parse_expr
from flask_cors import CORS
import traceback
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from skfuzzy import membership

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

def create_fuzzy_variable(name, labels, points, universe=np.arange(0, 101, 1)):
    """Create a fuzzy variable with trapezoidal membership functions."""
    
    var_instance = None

    if "Variable" in name or "variable" in name:
        var_instance = ctrl.Antecedent(universe, name)
    else: 
        var_instance = ctrl.Consequent(universe, name)

    for label, label_points in zip(labels, points):
        x_coords = [p['x'] for p in label_points]
    
        sorted_x = sorted(x_coords)
        
        var_instance[label] = fuzz.trapmf(universe, [
            sorted_x[0],
            sorted_x[1],
            sorted_x[2], 
            sorted_x[3]   
        ])
    
    return var_instance

@app.route('/fuzzy/calculate', methods=['POST'])
def fuzzy_calculate():
    try:
        data = request.get_json()
        variables_data = data['variables']
        target_data = data['target']
        
        if not variables_data or not target_data:
            return jsonify({'error': 'Missing variables or target data'}), 400
            
        input_vars = []
        for var_data in variables_data:
            if not var_data.get('points') or not var_data.get('labels'):
                return jsonify({'error': 'Invalid variable data structure'}), 400
                
            var = create_fuzzy_variable(
                name=var_data['title'],
                labels=var_data['labels'],
                points=var_data['points']
            )
            input_vars.append(var)
        
        output_var = create_fuzzy_variable(
            name=target_data['title'],
            labels=target_data['labels'],
            points=target_data['points']
        )

        rules = []
        num_labels_per_var = len(target_data['labels'])

        if len(input_vars) > 0:
            for i in range(num_labels_per_var):
                if i < len(list(output_var.terms.keys())):
                    consequent_term = list(output_var.terms.keys())[i]
                    
                    antecedents = []
                    for var in input_vars:
                        if i < len(list(var.terms.keys())):
                            antecedents.append(var[list(var.terms.keys())[i]])
                    
                    if antecedents:
                        combined_antecedent = antecedents[0]
                        for j in range(1, len(antecedents)):
                            combined_antecedent &= antecedents[j]
                        
                        rule = ctrl.Rule(combined_antecedent, output_var[consequent_term])
                        rules.append(rule)
        
        if not rules:
            return jsonify({'error': 'No valid rules could be created. Ensure at least one input variable and matching labels.'}), 400
            
        try:
            fuzzy_ctrl = ctrl.ControlSystem(rules)
        except Exception as e:
            return jsonify({'error': f"Error creating fuzzy control system (e.g., rule conflict): {str(e)}"}), 400
        
        return jsonify({
            'message': 'Fuzzy system constructed successfully. Use /fuzzy/plot_surface to visualize.',
            'num_inputs': len(input_vars),
            'input_titles': [var.label for var in input_vars],
            'output_title': output_var.label
        })
            
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500

@app.route('/fuzzy/plot_surface', methods=['POST'])
def fuzzy_plot_surface():
    try:
        data = request.get_json()
        variables_data = data['variables']
        target_data = data['target']
        plot_input_indices = data.get('plot_input_indices', [])
        reference_values = data.get('reference_values', {})
        
        if len(plot_input_indices) != 2:
            return jsonify({'error': 'Exactly two input variables must be selected for plotting the surface.'}), 400

        input_vars = []
        for var_data in variables_data:
            var = create_fuzzy_variable(
                name=var_data['title'],
                labels=var_data['labels'],
                points=var_data['points']
            )
            input_vars.append(var)
        
        output_var = create_fuzzy_variable(
            name=target_data['title'],
            labels=target_data['labels'],
            points=target_data['points']
        )
        
        rules = []
        num_labels_per_var = len(target_data['labels'])

        if len(input_vars) > 0:
            for i in range(num_labels_per_var):
                if i < len(list(output_var.terms.keys())):
                    consequent_term = list(output_var.terms.keys())[i]
                    
                    antecedents = []
                    for var in input_vars:
                        if i < len(list(var.terms.keys())):
                            antecedents.append(var[list(var.terms.keys())[i]])
                    
                    if antecedents:
                        combined_antecedent = antecedents[0]
                        for j in range(1, len(antecedents)):
                            combined_antecedent &= antecedents[j]
                        
                        rule = ctrl.Rule(combined_antecedent, output_var[consequent_term])
                        rules.append(rule)
        
        if not rules:
            return jsonify({'error': 'No valid rules could be created for plotting.'}), 400
            
        try:
            fuzzy_ctrl = ctrl.ControlSystem(rules)
        except Exception as e:
            return jsonify({'error': f"Error creating fuzzy control system for plotting (e.g., rule conflict): {str(e)}"}), 400
            
        plot_var1_idx = plot_input_indices[0]
        plot_var2_idx = plot_input_indices[1]

        plot_var1 = input_vars[plot_var1_idx]
        plot_var2 = input_vars[plot_var2_idx]

        resolution = 20
        x_surf = np.linspace(0, 100, resolution)
        y_surf = np.linspace(0, 100, resolution)
        X_surf, Y_surf = np.meshgrid(x_surf, y_surf)
        Z_surf = np.zeros((resolution, resolution))

        sim = ctrl.ControlSystemSimulation(fuzzy_ctrl)

        for i in range(resolution):
            for j in range(resolution):
                sim.input[plot_var1.label] = X_surf[i, j]
                sim.input[plot_var2.label] = Y_surf[i, j]

                for k, var in enumerate(input_vars):
                    if k != plot_var1_idx and k != plot_var2_idx:
                        if var.label in reference_values:
                            sim.input[var.label] = reference_values[var.label]
                        else:
                            sim.input[var.label] = (var.universe.min() + var.universe.max()) / 2

                try:
                    sim.compute()
                    Z_surf[i, j] = sim.output[output_var.label]
                except Exception as e:
                    print(f"Warning: Could not compute fuzzy output for ({X_surf[i,j]}, {Y_surf[i,j]}). Error: {e}")
                    Z_surf[i, j] = np.nan

        fig = plt.figure(figsize=(10, 7))
        ax = fig.add_subplot(111, projection='3d')
        
        surf = ax.plot_surface(X_surf, Y_surf, Z_surf, cmap='viridis', rstride=1, cstride=1, linewidth=0, antialiased=True)
        
        ax.set_xlabel(plot_var1.label)
        ax.set_ylabel(plot_var2.label)
        ax.set_zlabel(output_var.label)
        ax.set_title(f'Superficie de Control: {output_var.label} vs {plot_var1.label} y {plot_var2.label}')
        fig.colorbar(surf, shrink=0.5, aspect=5)
        
        buf = BytesIO()
        fig.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        plot_data = base64.b64encode(buf.read()).decode('utf-8')
        
        return jsonify({
            'plot': plot_data
        })
            
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
