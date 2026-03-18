# Simple in-memory database for our expense tracker
# This acts like a real database but keeps things simple for demo

initial_expenses = [
    {
        "id": 1,
        "title": "Netflix Monthly",
        "amount": 15.99,
        "date": "2024-01-15",
        "category": "Subscriptions"
    },
    {
        "id": 2,
        "title": "Lunch with team",
        "amount": 45.50,
        "date": "2024-01-16",
        "category": "Food"
    },
    {
        "id": 3,
        "title": "Adobe Creative Cloud",
        "amount": 52.99,
        "date": "2024-01-14",
        "category": "Subscriptions"
    },
    {
        "id": 4,
        "title": "Uber to meeting",
        "amount": 24.80,
        "date": "2024-01-16",
        "category": "Transport"
    },
    {
        "id": 5,
        "title": "Spotify Premium",
        "amount": 9.99,
        "date": "2024-01-13",
        "category": "Subscriptions"
    },
    {
        "id": 6,
        "title": "New headphones",
        "amount": 299.99,
        "date": "2024-01-12",
        "category": "Tech"
    }
]

# This function simulates fetching data from a real database
def get_expenses():
    """Return all expenses - like SELECT * FROM expenses"""
    return initial_expenses

# Add a new expense to our "database"
def add_expense(new_expense):
    """Insert a new expense - like INSERT INTO expenses"""
    # Generate a new ID (in real DB this happens automatically)
    new_id = max([item["id"] for item in initial_expenses] + [0]) + 1
    new_expense["id"] = new_id
    initial_expenses.append(new_expense)
    return new_expense

# Remove an expense from our "database"
def delete_expense(expense_id):
    """Delete an expense - like DELETE FROM expenses WHERE id = ?"""
    global initial_expenses
    initial_expenses = [expense for expense in initial_expenses if expense["id"] != expense_id]
    return True