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
            currentUser: current_user_email, // This will hold the current user's email
        };
    },
    computed: {
        // Compute filtered posts based on active tags
        filteredPosts() {
            if (this.activeTags.length === 0) {
                console.log("All posts:", this.posts);  // Log all posts
                return this.posts;
            }

            const filtered = this.posts.filter(post =>
                post.tags.some(tag => this.activeTags.includes(tag))
            );
            
            console.log("Filtered posts:", filtered);  // Log filtered posts based on active tags
            return filtered;
        }
    },
    methods: {
        // Fetch all posts and tags
        loadPosts() {
            axios.get(get_posts_url).then(response => {
                console.log("Posts fetched:", response.data.posts);
                this.posts = response.data.posts.map(post => ({
                    ...post,
                    tags: post.tags || [], // Ensure tags are included
                }));
                console.log("Loaded Posts:", this.posts);  // Log to check the loaded posts
                this.tags = response.data.tags;
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
    
            // Create a temporary post object
            const newPost = {
                content: this.newPostContent,
                user_email: this.currentUser,
                created_on: new Date().toISOString(), // Set the current date and time
                tags: this.extractTags(this.newPostContent), // Optional: Extract tags if needed
            };
    
            // Add the new post to the front of the list (to show it immediately)
            this.posts.unshift(newPost);
    
            // Post the new post to the server
            axios.post(create_post_url, { content: this.newPostContent }).then(response => {
                // Clear the input field after posting
                this.newPostContent = "";
                // Optionally reload posts from the server
                this.loadPosts();
            }).catch(error => {
                console.error("Failed to create post", error);
            });
        },
    
        // Extract tags from post content
        extractTags(content) {
            const tags = new Set();
            const regex = /#(\w+)/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                tags.add(match[1]); // Add the tag without the '#'
            }
            return Array.from(tags);
        },
    
        // Delete a post
        deletePost(postId) {
            const post = this.posts.find(p => p.id === postId);
            if (post.user_email !== this.currentUser) {
                console.warn("Unauthorized deletion attempt.");
                return;
            }
            
            axios.post(delete_post_url, { post_id: postId }).then(() => {
                this.loadPosts(); // Refresh the posts list after deletion
            });
        },
    
        // Toggle the active/inactive state of a tag
        toggleTag(tag) {
            if (this.activeTags.includes(tag)) {
                this.activeTags = this.activeTags.filter(t => t !== tag);
            } else {
                this.activeTags.push(tag);
            }
        },
    }
};

// Mounted lifecycle hook to load posts when the app is initialized
app.mounted = function() {
    this.loadPosts();
};

Vue.createApp(app).mount("#app");