---
author: "Matt Rossman"
date: 2017-08-26
title: Day 58
description: Future-proofing the energize module with a user guide and demo
weight: 10
---

As my final work week approaches, it's becoming more apparent that we might not have enough time to fully integrate the prediction system with the web app unless other people are able to keep working on it during the next few weeks.

As a precaution I want to ensure that I have enough documentation of the system I have in mind. Today I wrote a `README` guide for my [GitHub repo]({{< link-repo "energize" >}}) that generally goes over how to use the modeling system and a bit about how it works. There's also plenty of documentation within the actual `energize.py` module.

I also made a `demo` folder that contains a sample prediction environment. It holds a `demo.py` prediction script that showcases `energize.MultiRFModel` in action along with some simple Pandas usage. There's some clean sample input and output files using the naming convention I drafted [yesterday]({{< ref "day-57.md#solutions" >}}).

Lastly, I mentioned yesterday that you should be able to select certain columns from the input data to model and predict. That was fairly simple to implement. It can be used by passing a list of column names to the new `columns` parameter of `MultiRFModel`. The default option of `None` will use all data columns.
