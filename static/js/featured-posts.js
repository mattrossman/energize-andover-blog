$(document).ready(function() {
    var onlyFeatured = false;
    let btnFeaturedPosts = $("#btnFeaturedPosts");

    // toggles showing only featured posts or all posts
    function toggleFeatured() {
        $(".not-featured").toggle();
        onlyFeatured = !onlyFeatured;
        $("#post-list-status").text(onlyFeatured ? "only featured posts" : "all posts");
    }
    
    // configure btn handler
    btnFeaturedPosts.click(toggleFeatured);

    // click once on page load (start with only showing featured)
    btnFeaturedPosts.click();
});
