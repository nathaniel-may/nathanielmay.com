---
publishDate: 2019-09-19T20:49:52Z
title: "Don't Read This Monad Tutorial"
excerpt: 'A Scala walkthrough that builds a useful monad from scratch, explains the monad laws, and shows what happens when they are broken.'
image: 'https://pbs.twimg.com/media/Db4szC7W0AAKvHh.jpg:large'
category: 'Functional Programming'
tags:
  - scala
  - functional
author: 'Nathaniel May'
---

In an attempt to break the cycle where every monad tutorial claims to be better than the others, I seriously don't think this tutorial will make you understand monads better than any other one. That's because reading tutorials can only get you so far. Instead, you should write your own with the intent to publish it. Dig up all the details, try everything yourself, and answer all the questions your readers will inevitably have. I found inspiration in [Dan Piponi's](http://blog.sigfpe.com/2006/08/you-could-have-invented-monads-and.html) idea that I could have invented monads myself and [Brent Yorgey's](https://byorgey.wordpress.com/2009/01/12/abstraction-intuition-and-the-monad-tutorial-fallacy/) assertion that monads are not, in fact, burritos.

Below is the tutorial I wrote to help me understand Monads back in September 2018 with some minor modifications.

## The Issue of Ugliness

In scala we really like stringing together our method calls like this. It's easy to read and easy to debug.

```scala
List(1, 2, 3, 4, 5)
  .map(_ + 10)
  .filter(_ % 2 == 0)
  .take(2)
```

Instead of a regular list, the hypothetical app we're working on really needs a List where these functions return both the list result and a debug string from each of these functions.

```scala
object DebugList {
  //variable argument syntax so it works like List.apply
  def apply[A](a: A*):DebugList[A] = DebugList(List(a: _*))
}

case class DebugList[A](l: List[A]){
  def map[B](f: A => B): (DebugList[B], String) =
    (DebugList(l map f), "mapped")

  def filter(f: A => Boolean): (DebugList[A], String) =
    (DebugList(l filter f), "filtered")

  def take(n: Int): (DebugList[A], String) =
    (DebugList(l take n), s"took$n")
}
```

DebugList is used like this ...which is so ugly.

```scala
val (dl1, str1) = DebugList(1, 2, 3, 4, 5).map(_ + 10)
val (dl2, str2) = dl1.filter(_ % 2 == 0)
val (dl3, str3) = dl2.take(2)
```

But this is what our app needs, so we're gonna try and make it work.

The problem is that we have to do all this clunky matching on the tuples. Plus if we want to see our debug string in order, we need to do something like `s"$str1 $str2 $str3"` to read, print, or write them. Since the tuple is the issue let's try putting the tuple in another class so we can write functions like `flatMap` to do the gross stuff for us.

### flatMap and map

When we fill in the definition of `flatMap` and `map` for this case class we have to make sure the resulting debug object has a string with both the contents from this debug object and from the result of f.

```scala
case class Debug[A](a: A, s: String) {
  def flatMap[B](f: A => Debug[B]): Debug[B] = {
    val Debug(b, s1) = f(a)
    Debug(b, s + s1)
  }

  def map[B](f: A => B): Debug[B] =
    Debug(f(a), s)
}
```

Next we'll need a constructor in the companion object that gives us a way to turn regular old `A` objects into `Debug[A]` objects.

### A way inside

When we fill in the unit function, the empty string is a reasonable choice when one isn't already available.

```scala
case object Debug {
  def apply[A](x: A): Debug[A] =
    unit(x)

  def unit[A](x: A): Debug[A] =
    Debug(x, "")
}
```

### Customizing List

Now that we've refactored that tuple, we can make a BetterDebugList with functions that return our newly refactored Debug type instead of tuples.

```scala
object BetterDebugList {
  //variable argument syntax so it works like List.apply
  def apply[A](a: A*): BetterDebugList[A] = BetterDebugList(List(a: _*))
}

case class BetterDebugList[A](l: List[A]){
  def map[B](f: A => B): Debug[BetterDebugList[B]] =
    Debug(BetterDebugList(l map f), "mapped")

  def filter(f: A => Boolean): Debug[BetterDebugList[A]] =
    Debug(BetterDebugList(l filter f), "filtered")

  def take(n: Int): Debug[BetterDebugList[A]] =
    Debug(BetterDebugList(l take n), s"took $n")
}
```

BetterDebugList can now be used like this:

```scala
val debug = Debug(BetterDebugList(1, 2, 3, 4, 5))
  .flatMap(_.map(_ + 10))
  .flatMap(_.filter(_ % 2 == 0))
  .flatMap(_.take(2))
```

Whoa! that's looks pretty similar to how we originally used `List`. No more tuple matching!

In order to hide those explicit `flatMap` calls we can use for comprehensions because they're prettier but do exactly the same thing.

```scala
val debug = for {
  w <- Debug(BetterDebugList(1, 2, 3, 4, 5))
  x <- w.map(_ + 10)
  y <- x.filter(_ % 2 == 0)
  z <- y.take(2)
} yield z
```

And if you're annoyed with assigning names for each of your intermediate states, for comprehensions let you call them all the same thing. It almost makes our immutable code read a bit like it's mutable.

```scala
val debug = for {
  x <- Debug(BetterDebugList(1, 2, 3, 4, 5))
  x <- x.map(_ + 10)
  x <- x.filter(_ % 2 == 0)
  x <- x.take(2)
} yield x
```

Now you can get that debug string out like this:

```scala
println(debug.s)
```

## Surprise! You made a monad.

Just like many other functional programming tools, a monad takes legitimately useful code that might otherwise be very awkward to use and makes it feel more natural. Notice how we can use this same `Debug` class to make a debuggable version of any other class we want.

In Scala we use monads all the time because they are so natural. `List` and `Option` are both monads that we see in nearly every beginner Scala tutorial.

![alt text](https://pbs.twimg.com/media/Dn20jIIWsAERqkm?format=jpg&name=small)
photo source: [my twitter](https://twitter.com/codenoodle/status/1044189951372464128?s=20)

## Ok but what is a monad?

A monad needs...  
1 - flatMap (sometimes called bind)  
2 - unit (usually implemented with apply in Scala)  
3 - follow the three monad laws

Here are some examples of monads you're already familiar with. They all use the `apply` method instead of a function named "unit" and they all have `flatMap`.

```scala
List(1)                    == List.unit(1)
List(1,2,3)                == List.unit(1,2,3)
Option(5)                  == Option.unit(5)
Try(throw new Exception()) == Try.unit(throw new Exception())
```

In order to be a monad it has to follow the three monad laws too. These laws just make sure we can refactor our code in the way we expect and have predictable results.

### The Monad Laws

_f and g are functions  
m is an instance of a monad which is also called a "monadic action"_

1 - Right Identity

```scala
unit(z).flatMap(f) == f(z)
```

2 - Left Identity

```scala
m.flatMap(unit) == m
```

3 - Associativity

```scala
m.flatMap(f).flatMap(g) == m.flatMap(x => f(x).flatMap(g))
```

Let's look at examples of these law definitions using the Monad List. Imagine how weird using List would be if these statements were not always true:

1 - Right Identity

```scala
List(2).flatMap(x => List(x * 5)) == List(2 * 5)
```

2 - Left Identity

```scala
List(2).flatMap(List(_)) == List(2)
```

3 - Associativity

```scala
List(2).flatMap(w => List(w, w)).flatMap(y => List(y * 2)) ==
List(2).flatMap(x => List(x, x).flatMap(z => List(z * 2)))
```

## Break the Monad Laws

The FMCounter class counts how many times `flatMap` has been called on it. It looks like a monad, but it breaks some of the 3 laws.

Here's its definition. Let's find out which laws it breaks.

```scala
case object FMCounter {
  def unit[A](a: A): FMCounter[A] =
    FMCounter(a, 0)

  def append(str: String, end: String): FMCounter[String] =
    unit(str + end)
}

case class FMCounter[A](a: A, counter: Int) {
  def flatMap[B](f: A => FMCounter[B]): FMCounter[B] = {
    val FMCounter(b, k) = f(a)
    FMCounter(b, counter + k + 1)
  }

  def map[B](f: A => B): FMCounter[B] =
    FMCounter(f(a), counter)
}
```

FMCounter breaks right identity. Here's a counter example:

```
FMCounter.unit("My").flatMap(x => FMCounter.unit(x + "Counter")) = FMCounter(MyCounter,1)
FMCounter.unit("My" + "Counter") = FMCounter(MyCounter,0)
// not the same!
```

FMCounter breaks left identity. Here's a Counter example:

```
FMCounter.unit("MyCounter").flatMap(FMCounter.unit) = FMCounter(MyCounter,1)
FMCounter.unit("MyCounter") = FMCounter(MyCounter,0)
// not the same!
```

But FMCounter is actually associative.
If you look at the definition of associativity, you call flatMap the same number of times on each side which is a pretty good indication it passes.

But in case you were looking for something more formal, here's an unconventional proof that uses scala-ish syntax. Feel free to just roll on past if this if it's not your jam.

```
let {FM} be the set of all monadic actions of type FMCounter
let f : A => FMCounter[B]
let g : B => FMCounter[C]

Theorem:  ∀ x ∈ {FM} x.flatMap(f).flatMap(g) == x.flatMap(a => f(a).flatMap(g))
          x                               = FMCounter[A](a: A, i:         Int)
          f(a)                            = FMCounter[B](b: B, k0:        Int)
          x.flatMap(f)                    = FMCounter[B](b: B, i+k0+1:    Int)
          g(b)                            = FMCounter[C](c: C, k1:        Int)
          x.flatMap(f).flatMap(g)         = FMCounter[C](c: C, k0+k1+2:   Int)

          h: A => FMCounter[C]            = (a: A) => f(a).flatMap(g)
          h                               = (a: A) => {
                                                f(a) = FMCounter[B](b: B, k0:      Int)
                                                g(b) = FMCounter[C](b: C, k1:      Int)
                                                       FMCounter[C](b: C, k0+k1+1: Int)
                                            }

          h(a)                            = FMCounter[C](b: C, k0+k1+1: Int)
          x.flatMap(a => f(a).flatMap(g)) = x.flatMap(a => h(a))
          x.flatMap(a => h(a))            = FMCounter[C](b: C, k0+k1+2: Int)

          substitution: FMCounter[C](c: C, k0+k1+2: Int) == FMCounter[C](c: C, k0+k1+2: Int)
          TRUE
```

Since FMCounter counts the number of times `flatMap` has been called, it breaks the properties which require expressions to be equal that have different numbers of `flatMap`s.

Because it breaks two laws, there are multiple ways to correctly write the same code that result in different `flatMap` counts. All that means is that it's probably not the solution we're looking for. But also that it's not a monad.

## Conclusion

If you were faced with a specific problem like stringing together functions that return tuples, you really might have invented Monads yourself. Monads are simply a tool to make otherwise clunky solutions feel more natural. We use Monads all the time already so it's worth understanding why they're so good at what they do.
