---
author: "Matt Rossman"
date: 2017-07-14
title: Day 28
description: More data to work with
weight: 10
---


Met with the team today at the library. I gave an update on the status of the fitting process. Frank had looked into the Poisson regression and was having some trouble so I wanted to take a stab at it.

I too was unable to see a clear application of the theory to our scenario. From what I understand, a Poisson distribution is used for counts of event occurences. Our data doesn't immediately apply to this since we are measuring a continuous value, but you can tweak it by, for instance, measuring the counts of data points that lie between 400-450 kW. However that seems like an unintuitive adjustment to make. Perhaps I am just misunderstanding the Poisson distribution. Another area of concern is the requirement that "events" be independent, since it would seem that having a data point occur at a certain power value would make nearby values more likely to occur at a similar value (due to the time series nature of the data).

I spent most of the remainder of the day researching more stats methods that might be able to help us. I don't have much to talk about each of these so I'll just list off some of the topics that looked interesting:

- Stepwise regression
- Regression trees
- C4.5 Algorithm
- Beta distributions

Anil also stopped by today to provide some more data files. We now have data from Bancroft to work with, and I was able to load it into a Python script just fine. Later on I will take a look at some of the plots and see how things compare to the data from AHS.
