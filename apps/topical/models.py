from .common import db, Field, auth
from pydal.validators import *
import datetime

# Helper functions to get current user and time
def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_user():
    return auth.current_user.get('id') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()

# Define tables
db.define_table(
    'post',
    Field('user_id', 'reference auth_user', default=get_user),
    Field('user_email', 'string', default=get_user_email),
    Field('content', 'text', requires=IS_NOT_EMPTY()),
    Field('created_on', 'datetime', default=get_time),
)

db.define_table(
    'tag',
    Field('name', 'string', unique=True),
)

db.define_table(
    'post_tag',
    Field('post_id', 'reference post'),
    Field('tag_id', 'reference tag'),
)

# Commit table definitions to db
db.commit()