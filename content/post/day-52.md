---
author: "Matt Rossman"
date: 2017-08-18
title: Day 52
description: Bugfixing and class organization improvements
weight: 10
---

Last time, I left the `SingleRFModel` and `MultiRFModel` implementation as a rather tangled collection of methods. I wasn't satisfied with the organization of everything. I also didn't like the disjointedness between the process of training old sets and the process of predicting new ones.

#### Old setup
- All training feature matricies are created independently from the X and y window lists
- The training features matricies are merged along the column axis
- Prediction inputs are created as a whole feature matrix from a single point in time

#### Proposed setup
- Prediction inputs are created as a whole feature matrix from a single point in time
- Training feature matricies are created using the above method

<br>
Unfortunately the first method is noticably faster to process than the latter. The alternative is to instead make the `_input_vector` function a special case of the `_get_feats` call with only one pair of input/output windows. That's what I ended up doing. The `_get_training_arrays` method is still the slowest part of the training process, probably due to all the list comprehension loops. At some point I want to see if there's a more efficient way to generate the training arrays from the training windows.

I also finished implementing the column-specific features implementation for `MultiRFModel` and verified that it works. I switched from storing the submodels and their specific feature tables from a list to a dictionary (with column names as keys) so that you don't need placeholders if you only want certain columns to have specific features.

Along the way I came across a lot of small bugs that I ironed out (like incompatibility between certain window sizes and feature frequencies).

Lastly I continued working on the documentation for the classes and their methods. You can find the most recent version in the [energize module](https://github.com/mattrossman/andover-energy-analysis/blob/master/energize.py).
