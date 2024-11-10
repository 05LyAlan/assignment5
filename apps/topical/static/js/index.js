"use strict";

let app = {
    data() {
        return {
            posts: [],
            tags: [],
            activeTags: [],
            newPostContent: "",
            currentUser: "",
        };
    },
    methods: {
        // Fetch all posts and tags
        loadPosts() {
            axios.get(get_posts_url).then(response => {
                this.posts = response.data.posts.map(post => ({
                    ...post,
                    tags: post.tags || [],
                }));
                this.tags = response.data.tags;
            });
        },

        // Create a new post
        createPost() {
            if (!this.newPostContent) {
                alert("Post content cannot be empty.");
                return;
            }

            axios.post(create_post_url, { content: this.newPostContent }).then(response => {
                // Clear the input field after posting
                this.newPostContent = "";
                this.loadPosts(); // Refresh posts
            });
        },

        // Delete a post
        deletePost(postId) {
            axios.post(delete_post_url, { post_id: postId }).then(() => {
                this.loadPosts(); // Refresh posts
            });
        },

        // Toggle tags
        toggleTag(tag) {
            if (this.activeTags.includes(tag)) {
                this.activeTags = this.activeTags.filter(t => t !== tag);
            } else {
                this.activeTags.push(tag);
            }
        },

        filteredPosts() {
            if (this.activeTags.length === 0) {
                return this.posts;
            }
            return this.posts.filter(post =>
                post.tags.some(tag => this.activeTags.includes(tag))
            );
        },
    }
};

app.mounted = function() {
    this.loadPosts();
};

Vue.createApp(app).mount("#app");