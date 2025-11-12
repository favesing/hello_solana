#![allow(unused)]
#![allow(unused_assignments)]

use std::env;
use std::collections::HashMap;

struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}

struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

// trait
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)") //默认实现
    }
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}
impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("NewsArticle: {}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}
impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("Tweet: {}: {}", self.username, self.content)
    }
}


fn main() {
    let name = env::args().skip(1).next();
    match name {
        Some(n) => println!("Hello, {}!", n),
        None => println!("Please use ./rust_start name"),
    }

    let tup: (i32, f64, u8) = (500, 6.4, 1);
    println!("Tuple: ({}, {}, {})", tup.0, tup.1, tup.2);

    let arr = [1, 2, 3, 4, 5];
    for i in arr.iter() {
        println!("array element: {}", i);
    }

    let user = User{
        username: String::from("John Doe"),
        email: String::from("johndoe@example.com"),
        sign_in_count: 10,
        active: true,
    };

    println!("User: {} - {}", user.username, user.email);
    println!("User Sign in count: {}", user.sign_in_count);
    println!("User Active: {}", user.active);

    let mut x = 5;
    x = 10;
    println!("mut x: {}", x);

    let x = 5;
    let x = "zhaorui";
    println!("redefine x: {}", x);

    let condition = true;
    let number = if condition { 10 } else { 20 };
    println!("let condition number: {}", number);

    let config_max = Some(3u8);
    match config_max {
        Some(max) => println!("The maximum is configured to be {}", max),
        _ => (),
    }

    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
    println!("Black: ({}, {}, {})", black.0, black.1, black.2);
    println!("Origin: ({}, {}, {})", origin.0, origin.1, origin.2);

    let rect1 = Rectangle { width: 30, height: 50 };
    println!("Rectangle area: {}", rect1.area());

    let mut v = vec![1, 2, 3];
    println!("Vector remove: {}",v.remove(1));
    
    // vector get reference
    let v = vec![1, 2, 3, 4, 5];
    let third: &i32 = &v[2];
    println!("The third element is {third}");

    let third: Option<&i32> = v.get(2);
    match third {
        Some(third) => println!("The third element is {third}"),
        None => println!("There is no third element."),
    }
    // 可修改的vector
    let mut v = vec![100, 32, 57];
    for n_ref in &mut v {
        // n_ref has type &mut i32
        *n_ref += 50;
    }
    println!("Vector after adding 50: {:?}", v);

    //map
    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    let team_name = String::from("Blue");
    if scores.get(&team_name).is_some() {
        println!("判断存在: {}'s score is {}", team_name, scores[&team_name]);
    }

    let score = scores.get(&team_name).copied().unwrap_or(0);
    println!("{}'s score is {}", team_name, score);
    for (key, value) in &scores {
        println!("scores 遍历: {key}: {value}");
    }

    // map修改
    scores.insert(String::from("Blue"), 25);
    println!("sores修改: {:?}", scores);
    // 判断存在
    scores.entry(String::from("Blue")).or_insert(50);
    println!("sores判断存在并修改: {:?}", scores);

    
    println!("summarize: {}",returns_summarizable().summarize());

    //求最大值
    let number_list = vec![34, 50, 25, 100, 65];
    let max = largest(&number_list);
    println!("最大值: {}", max);
}

fn largest<T:PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from(
            "of course, as you probably already know, people",
        ),
        reply: false,
        retweet: false,
    }
}