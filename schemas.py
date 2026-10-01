from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str


class RestaurantCreate(BaseModel):
    name: str
    location: str
    image: str = ""


class FoodCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    restaurant_id: int
    image: str = ""


class OrderItemCreate(BaseModel):
    food_id: int
    quantity: int


class OrderCreate(BaseModel):
    user_id: int
    items: list[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    status: str