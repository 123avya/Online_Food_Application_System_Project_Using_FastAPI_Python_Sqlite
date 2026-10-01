# 🍔 Foodie – Online Food Ordering System

An online food ordering application built using **Python, FastAPI, SQLAlchemy, SQLite, HTML, CSS, and JavaScript**. The application allows users to explore restaurants, browse food items, add products to their cart, place orders, and track order status.

It also includes an **Admin Dashboard** for managing restaurants, food items, customer orders, and sales information.

## 📌 Project Overview

Foodie is a web-based food ordering system designed to simplify the process of ordering food online. It provides a user-friendly interface for customers and a dashboard for administrators to manage the application's data.

The frontend communicates with the FastAPI backend through REST APIs, while SQLite is used to store user, restaurant, food, and order information.

## ✨ Features

### 👤 User Features

* User login using name and email.
* Browse available restaurants.
* View restaurant details and food menus.
* Search for restaurants.
* View food descriptions, prices, categories, and images.
* Add food items to the shopping cart.
* Manage cart items and quantities.
* Calculate the total order amount.
* Place food orders.
* View order history.
* Track order status.

### 🛠️ Admin Features

* Admin login interface.
* View dashboard statistics.
* View total users, restaurants, food items, and orders.
* View total sales.
* Add new restaurants.
* Add food items to restaurants.
* Upload restaurant and food images or provide image URLs.
* View and delete restaurants.
* View and delete food items.
* View customer orders and ordered items.
* Update order status.

### 🎨 UI Features

* Modern dark-themed interface.
* Responsive design for different screen sizes.
* Restaurant and food cards.
* Search functionality.
* Interactive navigation.
* Toast notifications and confirmation dialogs.
* Image previews.
* Loading indicators and animated UI elements.

## 🧰 Technologies Used

| Technology   | Purpose                                    |
| ------------ | ------------------------------------------ |
| Python       | Backend programming                        |
| FastAPI      | REST API development                       |
| SQLAlchemy   | Database ORM                               |
| SQLite       | Database management                        |
| Pydantic     | Request data validation                    |
| HTML5        | Web page structure                         |
| CSS3         | Styling, animations, and responsive design |
| JavaScript   | Frontend functionality and API integration |
| Font Awesome | Icons                                      |
| Google Fonts | Typography                                 |

## 🏗️ Project Architecture

The application follows a frontend-backend architecture.

* **Frontend:** HTML, CSS, and JavaScript provide the user interface.
* **Backend:** FastAPI handles API requests and application logic.
* **ORM:** SQLAlchemy manages database operations.
* **Database:** SQLite stores application data.

The frontend communicates with the backend using JavaScript `fetch()` requests.

## 📂 Project Structure

```text
Online-Food-Ordering-System/
│
├── main.py                 # FastAPI application and API endpoints
├── database.py             # Database connection and session management
├── models.py               # SQLAlchemy database models
├── schemas.py               # Pydantic request schemas
│
├── food_ordering.db        # SQLite database (created automatically)
│
├── index.html              # Main frontend application
├── style.css               # Application styling
├── script.js               # Frontend logic and API integration
│
├── uploads/                # Uploaded restaurant and food images
│
└── README.md               # Project documentation
```

*Note: The filenames and folders shown above should match your actual GitHub repository.*

## 🗄️ Database Design

The application uses SQLite with SQLAlchemy to manage the following tables:

### 1. Users

Stores customer information.

* `id`
* `name`
* `email`

### 2. Restaurants

Stores restaurant details.

* `id`
* `name`
* `location`
* `image`

### 3. Foods

Stores food item information.

* `id`
* `name`
* `description`
* `price`
* `category`
* `restaurant_id`
* `image`

### 4. Orders

Stores customer order information.

* `id`
* `user_id`
* `user_name`
* `total_amount`
* `status`
* `date_ordered`

### 5. Order Items

Stores the individual food items included in each order.

* `id`
* `order_id`
* `food_id`
* `food_name`
* `quantity`
* `price`

## ⚙️ Installation and Setup

Follow these steps to run the project locally.

### Prerequisites

Make sure you have installed:

* Python 3.10 or later
* pip
* Visual Studio Code or another code editor
* A web browser

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
```

Navigate to the project folder:

```bash
cd Online-Food-Ordering-System
```

### Step 2: Create a Virtual Environment

```bash
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```bash
venv\Scripts\activate
```

** macOS / Linux:**

```bash
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install fastapi uvicorn sqlalchemy
```

### Step 4: Start the FastAPI Server

```bash
uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

### Step 5: Access the API Documentation

Open the following URL in your browser:

```text
http://127.0.0.1:8000/docs
```

FastAPI provides interactive API documentation where you can test the available endpoints.

### Step 6: Run the Frontend

Open `index.html` in your browser.

You can also use the Live Server extension in Visual Studio Code to launch the frontend.

Make sure the API URL configured in `script.js` matches the address of your running FastAPI server.

## 🔗 API Endpoints

### User APIs

| Method | Endpoint           | Description      |
| ------ | ------------------ | ---------------- |
| POST   | `/users`           | Create a user    |
| GET    | `/users`           | Get all users    |
| GET    | `/users/{user_id}` | Get a user by ID |

### Restaurant APIs

| Method | Endpoint                       | Description         |
| ------ | ------------------------------ | ------------------- |
| POST   | `/restaurants`                 | Add a restaurant    |
| GET    | `/restaurants`                 | Get all restaurants |
| DELETE | `/restaurants/{restaurant_id}` | Delete a restaurant |

### Food APIs

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| POST   | `/foods`           | Add a food item    |
| GET    | `/foods`           | Get all food items |
| DELETE | `/foods/{food_id}` | Delete a food item |

### Order APIs

| Method | Endpoint                    | Description         |
| ------ | --------------------------- | ------------------- |
| POST   | `/orders`                   | Place a new order   |
| GET    | `/orders`                   | Get all orders      |
| PUT    | `/orders/{order_id}/status` | Update order status |

### Admin API

| Method | Endpoint           | Description              |
| ------ | ------------------ | ------------------------ |
| GET    | `/admin/dashboard` | Get dashboard statistics |

## 🔄 Order Status

Orders can have the following statuses:

* Placed
* Preparing
* Out for Delivery
* Delivered
* Cancelled

## 🖥️ Application Workflow

1. The user opens the Foodie application.
2. The user logs in using their name and email.
3. The user browses available restaurants.
4. The user selects a restaurant and explores its food menu.
5. The user adds food items to the cart.
6. The user reviews the cart and places an order.
7. The order details are stored in the SQLite database.
8. The user can view their orders and check their status.
9. The administrator manages restaurants, food items, orders, and dashboard statistics.

## 🚀 Future Enhancements

* Secure user authentication and authorization.
* Password hashing and role-based access control.
* Online payment gateway integration.
* Food ratings and customer reviews.
* Restaurant and food filtering by category.
* Order cancellation and refund management.
* Email or SMS order notifications.
* Deployment to a cloud hosting platform.

## 🔒 Security Note

This project is intended for learning and demonstration purposes. Before deploying it to production, implement proper authentication and authorization, secure the admin routes, validate user input, and configure CORS with trusted origins.

The current user login flow uses name and email rather than password-based authentication. The admin login interface should not be considered secure unless authentication is enforced by the backend.

## 👩‍💻 Author

**Navya Narayan Gouda**

* GitHub: [Your GitHub Profile](https://github.com/YOUR-USERNAME)

## 📄 License

This project is available for educational and learning purposes. You may add an MIT License or another license to the repository if you wish to define how others can use and distribute the code.
