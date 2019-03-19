$(document).ready(function() {
    let btnFeaturedPosts = $("#btn-featured");

    // toggles showing only featured posts or all posts
    function toggleFeatured() {
        $("#post-list").children().toggleClass("featured-filter");
        $("#post-list-status").toggleClass("featured-filter");
    }
    
    // configure btn handler
    btnFeaturedPosts.click(toggleFeatured);
});
