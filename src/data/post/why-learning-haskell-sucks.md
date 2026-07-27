---
publishDate: 2020-02-24T05:31:10Z
updateDate: 2020-03-04T05:28:20Z
title: 'Why Learning Haskell Sucks'
excerpt: 'Why Haskell remains difficult for mainstream developers to learn, despite its passionate community and excellent resources.'
category: 'Haskell'
tags:
  - haskell
author: 'Nathaniel May'
---

![Marion Bolognesi watercolor face](https://dev-to-uploads.s3.amazonaws.com/i/8b98r756hh7hvk1muynx.jpg)
_image: [Marion Bolognesi](http://www.marion-b.com/index.php?/paintings/sneak-peek/) watercolor face_

Even for brilliant minds, Haskell often takes _multiple tries_ to learn. There are some significant technical hurdles you encounter early on, but that's not the problem. There are endless resources for learning about Haskell syntax, the IO monad, type class hierarchies and essentially every other unfamiliar aspect of Haskell. If you ever post a question to Stack Overflow with the [Haskell](https://stackoverflow.com/questions/tagged/haskell) tag, you'll quickly get thoughtful comments and clear answers from brilliant people. Once you discover [Hoogle](https://hoogle.haskell.org/) you immediately wonder how you ever coded without it. There are even [talks](https://www.youtube.com/watch?v=RvRVn8jXoNY) within the community helping current Haskellers empathize with new learners. Yet even with all this community support and passion for the language, at the peak of my frustration during my first attempt I remember saying out loud,

_"It feels like no one actually wants me to learn this."_

Now, after my second attempt at learning Haskell I feel confident that I can solve problems with Haskell and learn the parts I don't know yet, but I also know why I felt this way in the beginning.

I recently started listening to the [Corecursive](https://corecursive.com/) podcast by [Adam Gordon Bell](https://twitter.com/adamgordonbell) and in one [conversation](https://corecursive.com/040-tech-evangelism-with-gabriel-gonzalez/) with [Gabriel Gonzales](https://twitter.com/gabrielg439) they talk about why different tech products become mainstream and others do not. This resonated with me as a way to frame my experience with learning Haskell.

"Early adopters" are the people who are willing to put up with the warts of a new technology to build something they care about. Successful technologies that move into the mainstream _must_ win over "mainstream users" who want proven and polished products.

If you got a strong adverse reaction to the title of this post, you might be an early adopter. And early adopters are great! They're visionaries who imagine the way the world _could be_ and care about doing things the right way even if it's inconvenient. They also help people creating new technologies discover different directions their product could go.

However, early adopters are never going to convince mainstream developers to put in the work and potentially put their projects at risk for tech that's unpolished and completely new to their social circles. The best way to convert "mainstream users" is to offer an easy solution to a very painful problem.

And here is where we discover the core of the issue. I am, like most developers, a _mainstream developer_. The only reason Haskell entered my circle was because I started dating a PL Ph.D. student. I actually thought Haskell was really cool when I learned about it, but nothing stopped me from quitting the learning process when it got hard.

_Haskell doesn't solve any problems for me that I can't already solve in Scala._

That doesn't mean that Haskell isn't a good solution, and it doesn't mean that Haskell doesn't solve _other_ problems Scala can't solve. It just means it doesn't solve my problems in a way that makes the switch worth it. It also means that it's not the best solution to the kinds of problems my friends are having while they write CRUD apps in Javascript, Python, Java, and C# either.

For people creating new programming languages, Haskell _does_ offer a proven solution in the form of an extensive and mature ecosystem when it comes to making compilers. However, this success hasn't exactly broken Haskell into the mainstream market. You can tell Haskell isn't mainstream because there's no first-class support for it on any platforms. No cloud providers, no official database drivers, nothing. No other technologies have succumbed to the pressure of mainstream developers demanding Haskell support, because they're simply not demanding it. Even newer languages that are arguably _worse languages_, like Go, have successfully made it into the mainstream.

And this is why it felt like "no one actually wanted me to learn this." The problems I cared about were actively harder to solve in Haskell. And when experienced Haskell developers tried to persuade me with their early adopter rationale, it just made everything worse.

A sentiment I often heard from experienced devs is that Haskell is actually much "simpler" than other imperative programming languages and thus it's easier to understand. Now that I've learned enough Haskell I can absolutely see why this is the case. However, this is a much higher level conclusion that I believe is _actively harmful_ to mainstream developers trying to learn Haskell for the first time. I know it made me feel really stupid for not being able to understand something that everyone else sees as "simple."

When I learned Scala it legitimately felt so much simpler than Java. In Java I would have to write getters, setters, and constructors for every class I created. In Scala I just make a one line case class and all that work is done for me in a pretty frictionless way.

When Haskell enforces purity and immutability this does make reasoning about functions much simpler. However, for your average mainstream developer it makes writing them so much harder. This "simplicity" doesn't actually benefit the developer until they've retrained themselves to write code with these new restrictions which _takes time_.

Think about what it takes to copy a "hello world" program, and modify it so that it asks for your name and prints "hello \<name\>". Doing simple things in Haskell is not simple. You can't write that program without running into immutability and the IO Monad.

And I'm not suggesting we change that! But I am suggesting that we change the way we talk about it and just admit that doing simple things isn't simple in Haskell. Haskell developers might argue that an app that interacts with users directly isn't actually simple, and they're not wrong. But Haskell developers don't get to frame the world everyone else is coming from. A learner is going to have their own pre-conceptions of what should be simple, and we can't pretend it's going to be easy to learn the Haskell way of doing those things.

Even though there were lots of hurdles to get to this point, I haven't given up on Haskell. I know it will likely never be the kind of polished experience I want from my programming languages, but I'm going to keep learning it and using it to expand the way I think about software.

There are lots of compassionate people in the Haskell world trying to make the path to learning Haskell easier, and these are amazing efforts that I am truly grateful for. However, Haskell isn't accidentally going to become a mainstream language. If that ever happens it's going to take an enormous coordinated effort to make it worth it for mainstream developers like me to make the switch. And if that _does_ happen, you better believe that stuff like monads and type classes won't stop us.
