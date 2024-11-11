from py4web import action, request, abort, URL
from .common import auth
from .models import db, get_user_email
import re


@action('index')
@action.uses('index.html', db, auth.user)
def index():
    """
    Renders the main page with URLs needed for AJAX calls.
    """
    return dict(
        get_posts_url=URL('get_posts'),
        create_post_url=URL('create_post'),
        delete_post_url=URL('delete_post'),
        current_user_email=get_user_email()
    )


@action('get_posts')
@action.uses(db, auth.user)
def get_posts():
    """
    Returns a list of all posts and tags for the logged-in user.
    """
    posts = db(db.post).select(orderby=~db.post.created_on).as_list()
    tags = db(db.tag).select().as_list()

    for post in posts:
        post_tags = db(db.post_tag.post_id == post['id']).select(db.tag.name)
        post['tags'] = [tag.name for tag in post_tags]
    
    return dict(posts=posts, tags=tags)

@action('create_post', method="POST")
@action.uses(db, auth.user)
def create_post():
    """
    Allows a logged-in user to create a new post with optional tags.
    """
    content = request.json.get('content')
    if not content:
        return dict(error="Post content cannot be empty.")

    user_email = get_user_email()

    # Insert the new post
    post_id = db.post.insert(content=content, user_email=user_email)

    # Extract and store tags
    tags = set(re.findall(r"#(\w+)", content))  # Extract tags from content
    tag_ids = []
    for tag_name in tags:
        # Check if tag already exists
        tag = db(db.tag.name == tag_name).select().first()  # Select tag if it exists
        if not tag:
            # Insert new tag if not found
            tag = db.tag.insert(name=tag_name)
        tag_ids.append(tag.id)

    # Link tags to the post
    for tag_id in tag_ids:
        db.post_tag.insert(post_id=post_id, tag_id=tag_id)

    return dict(post_id=post_id)


@action('delete_post', method="POST")
@action.uses(db, auth.user)
def delete_post():
    """
    Allows a user to delete their own post. If successful, also removes unused tags.
    """
    post_id = request.json.get('post_id')
    post = db.post(post_id)

    # Ensure the post exists and belongs to the current user
    if not post or post.user_email != get_user_email():
        abort(403, "Unauthorized deletion attempt.")

    # Delete the post
    db(db.post.id == post_id).delete()

    # Clean up orphan tags
    tags_in_post = db(db.post_tag.post_id == post_id).select(db.post_tag.tag_id).as_list()
    db(db.post_tag.post_id == post_id).delete()  # Remove tag relationships for the post

    # Remove tags with no associated posts left
    for tag in tags_in_post:
        tag_id = tag['tag_id']
        if not db(db.post_tag.tag_id == tag_id).count():
            db(db.tag.id == tag_id).delete()

    return dict(success=True)