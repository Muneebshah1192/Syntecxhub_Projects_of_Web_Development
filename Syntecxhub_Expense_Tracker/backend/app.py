# Our main Flask application - think of this as the waiter between frontend and database
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_expenses, add_expense, delete_expense

# Create our Flask app
app = Flask(__name__)
# Allow requests from our frontend (important for development)
CORS(app)

# Welcome message when someone visits the API
@app.route('/', methods=['GET'])
def home():
    """API home - shows all available endpoints"""
    return jsonify({
        "message": "Welcome to Expense Tracker API",
        "endpoints": {
            "GET /api/expenses": "Get all expenses",
            "POST /api/expenses": "Add new expense",
            "DELETE /api/expenses/<id>": "Delete an expense"
        }
    })

# Get all expenses - this is like our "SELECT *" endpoint
@app.route('/api/expenses', methods=['GET'])
def get_all_expenses():
    """Fetch all expenses from our database"""
    try:
        expenses = get_expenses()
        # Calculate summary statistics for the dashboard
        total_expenses = sum(item['amount'] for item in expenses)
        
        return jsonify({
            "success": True,
            "data": expenses,
            "summary": {
                "total_expenses": round(total_expenses, 2),
                "count": len(expenses)
            }
        }), 200
    except Exception as e:
        # If something goes wrong, send back error message
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Add a new expense - this handles the POST requests from our form
@app.route('/api/expenses', methods=['POST'])
def create_expense():
    """Create a new expense entry"""
    try:
        # Get the data from the request body
        new_expense = request.json
        
        # Validate that we have all required fields
        required_fields = ['title', 'amount', 'date', 'category']
        for field in required_fields:
            if field not in new_expense:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Add to database
        created_expense = add_expense(new_expense)
        
        return jsonify({
            "success": True,
            "data": created_expense,
            "message": "Expense added successfully!"
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Delete an expense - notice the <int:id> in the URL
@app.route('/api/expenses/<int:id>', methods=['DELETE'])
def remove_expense(id):
    """Delete an expense by its ID"""
    try:
        delete_expense(id)
        return jsonify({
            "success": True,
            "message": f"Expense {id} deleted successfully!"
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# This starts our server when we run this file
if __name__ == '__main__':
    print("✨ Starting Expense Tracker API Server...")
    print("📍 Server running at: http://localhost:5000")
    print("📝 Try visiting: http://localhost:5000/api/expenses")
    app.run(debug=True, port=5000)