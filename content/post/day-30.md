---
author: "Matt Rossman"
date: 2017-07-18
title: Day 30
description: The holy grail of smart energy resources
weight: 10
---

## An exciting find
I ended yesterday with a CMU lecture on nonlinear regression that looked eerily similar to the work we're doing. After sharing it with the team, Frank noticed that it's actually part of an entire course called *Computational Methods for the Smart Grid*. All of the resources (lecture videos, slides, notes) are freely availabe online. The course teaches how to do precisely what we've been trying to accomplish this whole summer. I only wish we had found it sooner!

[I made a playlist here](https://www.youtube.com/playlist?list=PLvWdgVGcyGIlbqDQmSGq6SDWgs94qamSR) of all the course's video lectures. Linked in the description is [the course page](http://www.cs.cmu.edu/~zkolter/course/15-884/) that contains the lecture slides and notes.

I spent today watching the first couple of lectures to fill in some of the background I was missing for the 6th lecture on nonlinear regression (and beyond).

#### Lecture 1
This mainly gave an overview of the course, what it is trying to accomplish and why (where energy waste is coming from, the negative consequences of it). It lays out the basic principles of how you can use various factors to model and predict energy usage.

#### Lecture 2
The main topic here is modeling via linear regression. Prof. Kolter explains the theory and formal notation of models, which consist of:

- **Input:** $x_i \in \mathbb{R}^n, i=1,...,m$
- **Output:** $y_i \in \mathbb{R}$
- **Model Parameters:** $\theta \in \mathbb{R}^k$
- **Output:** $\hat{y}_i \in \mathbb{R}$

I won't waste time copying everything over from his slides, but you can find the full explainations on the course site.

He introduces that fact that we can make a loss function that measures how well the model fits the input data (the most common one is the squared loss). The end goal is to figure out how to minimize the loss function for all inputs (called the cost function).

#### Lecture 3
To go about minimizing the cost function (i.e. perform a least squares regression) he rewrites the cost function in matrix notation using principles from linear algebra. It's pretty cool that I'll be taking linear algebra this fall, so I'm already getting a head start on the basics. Then since our variable $\theta$ is a vector, you have to use the gradient to optimize the function. That is really cool as well, because just last semester I took multivariable calculus where we learned how to do this.

The process is somewhat complicated and uses some rules that he derives in the lecture, but after replaying the confusing bits enough times it finally makes sense. The end result is called the *normal equations*: $$ 2\Phi^T\Phi\theta^* - 2\Phi^Ty = 0 \Longleftrightarrow \theta^* = (\Phi^T\Phi)^{-1}\Phi^Ty $$

He's using Matlab for the course and he explains that there's a built in function for the normal equations, so I'm guessing there will be something similar in one of the Python libraries that we're using.

The rest of the lecture is a review of linear algebra concepts, which are also available in a neatly organized note sheet in his course resources.

Tomorrow I hope to make my way up to the lecture on nonlinear regression and eventually try to implement that in Python. And that's only a quarter of the way through the course, so I wonder what other advanced topics he covers later on!
