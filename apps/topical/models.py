from .common import db, Field, auth
from pydal.validators import *
import datetime

def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_user():
    return auth.current_user.get('id') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()

# Define post model with user_email
db.define_table(
    'post',
    Field('user_id', 'reference auth_user', default=get_user),
    Field('user_email', 'string', default=get_user_email),  # New field for user email
    Field('content', 'text', requires=IS_NOT_EMPTY()),
    Field('created_on', 'datetime', default=get_time),
)

# Define tag model
db.define_table(
    'tag',
    Field('name', 'string', unique=True),
)

# Relationship between posts and tags
db.define_table(
    'post_tag',
    Field('post_id', 'reference post'),
    Field('tag_id', 'reference tag'),
)

db.commit()