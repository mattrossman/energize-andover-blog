$(document).ready(function() {
    let btnFeaturedPosts = $("#btn-featured");
    let hashFeatured = "#featured";
    let hashAll = "#all";

    // toggles showing only featured posts or all posts
    function toggleFeatured(state = null) {
        $("#post-list").children().toggleClass("featured-filter", state);
        $("#post-list-status").toggleClass("featured-filter", state);

        if ($("#post-list-status").hasClass("featured-filter")) {
            setUrlHash(hashFeatured);
        }
        else {
            setUrlHash(hashAll);
        }
    }

    function parseHash(hash) {
        if (hash == hashFeatured) { toggleFeatured(true); }
        else if (hash == hashAll) { toggleFeatured(false); }
    }

    function setUrlHash(hash) {
        window.location.replace(window.location.origin + hash);
    }

    // configure btn handler
    btnFeaturedPosts.click(toggleFeatured);

    // check if the user is reloading a page that should be filtered
    parseHash(window.location.hash);
});
