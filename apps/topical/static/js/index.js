"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {
    data() {
        return {
            posts: [],
            tags: [],
            activeTags: [],
            newPostContent: "",
            currentUser: current_user_email,
        };
    },
    computed: {
        filteredPosts() {
            if (this.activeTags.length === 0) {
                return this.posts;
            }
            
            console.log("Active Tags:", this.activeTags);
            return this.posts.filter(post => {
                const postTags = [...post.tags];
                return postTags.some(tag => this.activeTags.includes(tag));
            });
        }
    },
    methods: {
        // Fetch all posts and tags
        loadPosts() {
            axios.get(get_posts_url).then(response => {
                console.log("Posts fetched:", response.data.posts);
                this.posts = response.data.posts.map(post => ({
                    ...post,
                    tags: post.tags || [],
                }));
                const allTags = new Set();
                this.posts.forEach(post => {
                    post.tags.forEach(tag => allTags.add(tag));
                });
        
                this.tags = Array.from(allTags).map(tag => ({ name: tag }));
            }).catch(error => {
                console.error("Error loading posts:", error);
            });
        },
    
        // Create a new post
        createPost() {
            if (!this.newPostContent) {
                alert("Post content cannot be empty.");
                return;
            }
    
            const newPost = {
                content: this.newPostContent,
                user_email: this.currentUser,
                created_on: new Date().toISOString(),
                tags: this.extractTags(this.newPostContent),
            };
    
            this.posts.unshift(newPost);
    
            axios.post(create_post_url, { content: this.newPostContent }).then(response => {
                this.newPostContent = "";
                this.loadPosts();
            }).catch(error => {
                console.error("Failed to create post", error);
            });
        },
    
        extractTags(content) {
            const tags = new Set();
            const regex = /#(\w+)/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                tags.add(match[1]);
            }
            return Array.from(tags);
        },
    
        deletePost(postId) {
            const post = this.posts.find(p => p.id === postId);
            if (post.user_email !== this.currentUser) {
                console.warn("Unauthorized deletion attempt.");
                return;
            }
            
            const postTags = post.tags;
            axios.post(delete_post_url, { post_id: postId }).then(() => {
                this.posts = this.posts.filter(p => p.id !== postId);
                this.updateTags(postTags);
                this.loadPosts();
            });
        },
    
        toggleTag(tag) {
            if (this.activeTags.includes(tag)) {
                this.activeTags = this.activeTags.filter(t => t !== tag);
            } else {
                this.activeTags.push(tag);
            }
        },

        updateTags(postTags) {
            postTags.forEach(tag => {
                const isOrphaned = !this.posts.some(post => post.tags.includes(tag));
    
                if (isOrphaned) {
                    this.tags = this.tags.filter(t => t.name !== tag);
                    this.activeTags = this.activeTags.filter(t => t !== tag);
                }
            });
        }
    }
};

app.mounted = function() {
    this.loadPosts();
};

Vue.createApp(app).mount("#app");