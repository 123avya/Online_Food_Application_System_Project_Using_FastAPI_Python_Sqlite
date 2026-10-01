from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pathlib import Path

from database import *
from models import *
from schemas import *

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/users")
def create_user(user_data: UserCreate,db: Session = Depends(get_db)):
    existing_user = (db.query(User).filter(User.email == user_data.email).first()
    )
    if existing_user:
        return {
            "message": "User already exists",
            "user": {
                "id": existing_user.id,
                "name": existing_user.name,
                "email": existing_user.email
            }
        }

    user = User(name=user_data.name,email=user_data.email)

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User created successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
        for user in users
    ]


@app.get("/users/{user_id}")
def get_user(user_id: int,db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }


@app.post("/restaurants")
def create_restaurant(restaurant_data: RestaurantCreate,db: Session = Depends(get_db)):
    restaurant = Restaurant(
        name=restaurant_data.name,
        location=restaurant_data.location,
        image=restaurant_data.image
    )

    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)

    return {
        "message": "Restaurant created successfully",
        "id": restaurant.id,
        "name": restaurant.name,
        "location": restaurant.location,
        "image": restaurant.image
    }


@app.get("/restaurants")
def get_restaurants(db: Session = Depends(get_db)):
    restaurants = db.query(Restaurant).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "location": r.location,
            "image": r.image
        }
        for r in restaurants
    ]

@app.delete("/restaurants/{restaurant_id}")
def delete_restaurant(restaurant_id: int,db: Session = Depends(get_db)):
    restaurant = (db.query(Restaurant).filter(Restaurant.id == restaurant_id).first())
    if not restaurant:
        raise HTTPException(status_code=404,detail="Restaurant not found")
    db.query(Food).filter(Food.restaurant_id == restaurant_id).delete()
    db.delete(restaurant)
    db.commit()

    return {
        "message": "Restaurant deleted successfully"
    }


@app.post("/foods")
def create_food(food_data: FoodCreate,db: Session = Depends(get_db)):
    restaurant = (db.query(Restaurant).filter(Restaurant.id == food_data.restaurant_id).first())
    if not restaurant:
        raise HTTPException(status_code=404,detail="Restaurant not found")
    food = Food(
        name=food_data.name,
        description=food_data.description,
        price=food_data.price,
        category=food_data.category,
        restaurant_id=food_data.restaurant_id,
        image=food_data.image
    )

    db.add(food)
    db.commit()
    db.refresh(food)

    return {
        "message": "Food created successfully",
        "id": food.id,
        "name": food.name
    }


@app.get("/foods")
def get_foods(db: Session = Depends(get_db)):
    foods = db.query(Food).all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "description": f.description,
            "price": f.price,
            "category": f.category,
            "restaurant_id": f.restaurant_id,
            "image": f.image
        }
        for f in foods
    ]

@app.delete("/foods/{food_id}")
def delete_food(food_id: int,db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404,detail="Food not found")

    db.delete(food)
    db.commit()

    return {
        "message": "Food deleted successfully"
    }


@app.post("/orders")
def create_order(order_data: OrderCreate,db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == order_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="User not found")

    if not order_data.items:
        raise HTTPException(status_code=400,detail="Order must have at least one item")

    total_amount = 0
    order_items_data = []

    for item in order_data.items:
        food = db.query(Food).filter(Food.id == item.food_id).first()

        if not food:
            raise HTTPException(status_code=404,detail=f"Food item {item.food_id} not found")

        item_total = food.price * item.quantity
        total_amount += item_total

        order_items_data.append({
            "food_id": food.id,
            "food_name": food.name,
            "quantity": item.quantity,
            "price": food.price
        })

    order = Order(
        user_id=user.id,
        user_name=user.name,
        total_amount=total_amount,
        status="Placed"
    )

    db.add(order)
    db.flush()

    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=order.id,
            food_id=item_data["food_id"],
            food_name=item_data["food_name"],
            quantity=item_data["quantity"],
            price=item_data["price"]
        )
        db.add(order_item)

    db.commit()
    db.refresh(order)

    return {
        "message": "Order placed successfully",
        "order": {
            "id": order.id,
            "user_id": order.user_id,
            "user_name": order.user_name,
            "total_amount": order.total_amount,
            "status": order.status,
            "date_ordered": order.date_ordered.strftime("%Y-%m-%d %H:%M") if order.date_ordered else "",
            "items": [
                {
                    "food_id": i.food_id,
                    "food_name": i.food_name,
                    "quantity": i.quantity,
                    "price": i.price
                }
                for i in db.query(OrderItem)
                .filter(OrderItem.order_id == order.id)
                .all()
            ]
        }
    }


@app.get("/orders")
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.id.desc()).all()

    result = []

    for order in orders:
        items = (db.query(OrderItem).filter(OrderItem.order_id == order.id).all())

        result.append({
            "id": order.id,
            "user_id": order.user_id,
            "user_name": order.user_name,
            "total_amount": order.total_amount,
            "status": order.status,
            "date_ordered": order.date_ordered.strftime("%Y-%m-%d %H:%M") if order.date_ordered else "",
            "items": [
                {
                    "food_id": item.food_id,
                    "food_name": item.food_name,
                    "quantity": item.quantity,
                    "price": item.price
                }
                for item in items
            ]
        })

    return result


@app.put("/orders/{order_id}/status")
def update_order_status(order_id: int,status_data: OrderStatusUpdate,db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404,detail="Order not found")

    order.status = status_data.status
    db.commit()
    db.refresh(order)

    return {
        "message": "Order status updated successfully",
        "id": order.id,
        "status": order.status
    }


@app.get("/admin/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_restaurants = db.query(Restaurant).count()
    total_foods = db.query(Food).count()
    total_orders = db.query(Order).count()

    total_sales = db.query(func.coalesce(func.sum(Order.total_amount), 0)).scalar()

    return {
        "users": total_users,
        "restaurants": total_restaurants,
        "foods": total_foods,
        "orders": total_orders,
        "total_sales": total_sales
    }