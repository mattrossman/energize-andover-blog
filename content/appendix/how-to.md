---
author: "Matt Rossman"
date: 2017-06-23
title: Making Your Own GitHub Pages Blog
hidden: true
description: 
weight: 10
---

**Guide Contents:**
{{< toc >}}


# Introduction
This guide explains how I went about hosting this blog.

At the time of this posting, I am running 64-bit Ubuntu 16.04 LTS on an HP EliteBok 8460p.

# Hugo

### Description
There are many ways to host a website. Most popular content management systems (CMS) like Wordpress or Weebly process your web requests on a server, which builds the static content and sends it to your computer's browser. This makes it conveinent to manage, but it requires a server to be available to process these requests. It also is slower because the page has to be built before it is received by your browser. Most websites can only function this way because their content is never fixed (think Facebook, Google, Youtube, etc)

However, for a blog, the only content would exist there is the content you put there. Enter static site generators. These programs let you easily create site content without manually writing the code for it. When it's time to publish, the static site tool will build the appropriate HTML, CSS, and JavaScript into the appropriate file structure. This lets you host the site on a static server like GitHub.

### Setup

I recommend you read the [Hugo Quickstart Guide](https://gohugo.io/overview/quickstart/) if you get stuck, but I'll be going over the essentials.

To get Hugo, either [download and install it from their site](https://gohugo.io/) or run

	sudo apt-get install hugo

in the terminal.

Now, navigate to a location where you would like to store your site files. I stored mine in my `Documents` folder.

	cd path/to/site/location

To start your Hugo project, run

	hugo new site my-site-name

with the site name you desire.

### Picking a Theme
Next, [pick a theme from Hugo's website](https://themes.gohugo.io/). You can find themes anywhere and even make your own, but this site has a nice catalog. Click the **Blog** tag on the right side of the page to get themes optimized for blogs.

Most of these themes should include a demo so you can get a feel for the site layout. You can customize everything later, but it helps to get a nice simple foundation to work off of. Click download once you find one you like. It will probably direct you to a GitHub page for the theme with installation instructions.

You will need Git installed to clone the theme files. Get it with

	sudo apt-get install git

Now navigate to your site themes folder and clone the theme repository

	cd my-site-name/themes
	git clone https://github.com/example-user/example-theme-name

At this point I recommend you change the permissions on this folder. You can do with with a `chmod` command if you want, but in Ubuntu it's easier to just right click on the folder you just clone, click "Permissions", and change everything to "Access files". Then click "Change Permissions for Enclosed Files" and once again set it all to "Access files".

The reason for this is that this is recognized as an existing Git repository, and if you make changes inside it Git won't detect changes but won't let you commit or push them.

Another option is to include the themes path in your site's `.gitignore` file later on, but I personally wanted to include my theme files in my site's repository.

### Adding content
Hugo content is written in the Markdown language. You can read about [Hugo's Markdown syntax here](https://sourceforge.net/p/hugo-generator/wiki/markdown_syntax/).

My theme came with a sample site, and I hope yours does too. If not, check out the quickstart guide and read about adding content. I copied my example site files into my main site directory. To view the site locally, run

	hugo server

in a terminal from your site directory. It will build the static content and host it locally on your computer. Ctrl+Click the link in terminal to open it in a browser and see how your site looks. As you make changes to your Hugo files, the server will automatically rebuild your site.

### Customizing it
#### Content
Go to your site's `content` folder. This is where the Markdown files are stored; these serve as your blog posts. At the start of each file is some meta data about the post like title and date. I recommend you use one of the example posts as a starting point. Get rid of parameters you don't need and replace the post content with some of your own. Make sure that none of your changes break the site.

The other important file you will need to change is your site's `config.toml` file. You will most likely need to change the `baseURL` variable here, since it is used all throughout your site to make links to posts and resources. You can also change your site's title and other meta data. Read the ReadMe on your theme's GitHub page for more information about the parameters here.

The last step is to simply run

	hugo

This builds all the files for your site and places them in a `public` folder in your site directory.


## GitHub Pages
### Setting up your Git Repo
By now you already have Git installed on your computer. Go to [GitHub's website](https://github.com) and make an account if you don't already have one.

Now make a new repository and give it a simple name. You don't need to initialize the repository with a README.

Now in your terminal navigate to that `public` folder your built. We're going to make this folder our Git repository. Run

	git init

This makes a hidden `.git` file that holds all the Git magic. Now you need to connect your local repository with the remote one you made on GitHub.

	git remote add origin https://github.com/username/repo-name.git

This sets the destination URL when you want to push changes later on. Now run

	git add --all

This adds the changes you made in your repository to the "stage" to be "committed" later on. You can see the changes that are stages by running

	git status

Now run

	git commit -m "My first commit!"

This confirms your changed files that were staged.

### Pushing your changes
Up until this point, everything is still happening locally on your computer. To sync your local master copy with the remote one, run

	git push origin master

You'll have to enter your login credentials to push these remote changes. If you want to avoid logging in every time, [follow this guide](https://stackoverflow.com/questions/8588768/git-push-username-password-how-to-avoid) to set up an RSA SSH key.

Refresh your GitHub repo page and see if the files were pushed correctly. When you see that they've appeared, click "Settings" and scroll down to "GitHub Pages". Set the source to "master branch" and refresh until you get a green publish confirmation above it. It should provide a URL that looks like `https://username.github.io/repo-name/`. Click it and you should see your site hosted online! If your styling is messed up, it's prbably because your `baseURL` is not configured properly in your `config.toml` file. Copy your site's url and paste it into the config file. Pay attention to the trailing backslash! Now rebuild it, add the changes to the stage, commit them, and push to the remote again. After a few moments you can refresh and see if your styling is working properly.

## Further Customization
There's too much information for me to go over, but if you know how to use HTML, CSS, and JavaScript you can completely customize your site. Earlier I told you to lock your theme files, so if you want to make changes just copy to file you want to change and add it to you site directory. The copied file will override the theme file. This also makes it easy to revert changes if something goes wrong.

Hugo uses it's own "Go" language to template the HTML files that make your site structured how it is. These files are located in the theme's `layouts` folder. Play around with these and [read about how the templates work](https://gohugo.io/templates/go-templates/). Also [read about shortcodes](https://gohugo.io/extras/shortcodes/) to add custom elements to your posts. Lastly, Hugo has a great [help forum](https://discourse.gohugo.io/) for any other questions.

Good luck!
