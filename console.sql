CREATE TABLE Category (
    CategoryID serial PRIMARY KEY,
    Name varchar(20),
    Description varchar(100),
    PictureUrl varchar(100)
);

CREATE TABLE Account (
    AccountID serial PRIMARY KEY,
    Name varchar(20),
    Description varchar(100),
    MoneyAmount numeric
);

CREATE TABLE Income (
    IncomeID serial PRIMARY KEY,
    CategoryID integer REFERENCES Category(CategoryID),
    AccountID integer REFERENCES Account(AccountID),
    Money numeric,
    Date timestamp
);

CREATE TABLE Expenditure (
    ExpenditureID serial PRIMARY KEY,
    CategoryID integer REFERENCES Category(CategoryID),
    AccountID integer REFERENCES Account(AccountID),
    Money numeric,
    Date timestamp
);

CREATE TABLE Target (
    TargetID serial PRIMARY KEY,
    AccountID integer REFERENCES Account(AccountID),
    Name varchar(20),
    TotalPlannedAmount numeric
);

CREATE TABLE TargetStep (
    TargetStepID serial PRIMARY KEY,
    TargetID integer REFERENCES Target(TargetID),
    PlannedAmount numeric DEFAULT 100,
    PlannedDate timestamp
);

insert into Category(Name, Description, PictureUrl)
values	('Еда и напитка', null, 'fa-trash'),
        ('Покупки', null, 'fa-trash'),
        ('Жилье', null, 'fa-trash'),
        ('Транспорт', null, 'fa-trash'),
        ('Автомобиль', null, 'fa-trash'),
        ('Развлечения', null, 'fa-trash'),
        ('Связь, ПК', null, 'fa-trash'),
        ('Инвестиции', null, 'fa-trash'),
        ('Зарплата', null, 'fa-trash'),
        ('Проценты', null, 'fa-trash'),
        ('Доход от Аренды', null, 'fa-trash');

CREATE VIEW expenditure_full AS
SELECT Expenditure.ExpenditureID, Expenditure.AccountID, Expenditure.Money, Expenditure.Date, Category.Name, Category.PictureUrl
FROM Expenditure LEFT JOIN Category ON Expenditure.CategoryID = Category.CategoryID;

CREATE VIEW income_full AS
SELECT Income.IncomeID, Income.AccountID, Income.Money, Income.Date, Category.Name, Category.PictureUrl
FROM Income LEFT JOIN Category ON Income.CategoryID = Category.CategoryID;

CREATE VIEW transactions AS
select * from expenditure_full
union all
select * from income_full;

-- select * from transactions order by Date desc;

-- select * from transactions where AccountID = 21 order by Date desc;

-- SELECT * FROM Expenditure LEFT JOIN Category ON Expenditure.CategoryID = Category.CategoryID where Expenditure.AccountID = 21
-- union all
-- SELECT * FROM Income LEFT JOIN Category ON Income.CategoryID = Category.CategoryID where Income.AccountID = 21 order by Date desc;

-- delete from expenditure where expenditureid = 75;

-- select * from transactions order by Date desc;

-- SELECT * FROM Expenditure LEFT JOIN Category ON Expenditure.CategoryID = Category.CategoryID WHERE Date::timestamp > '2020-12-01' AND Date::timestamp < '2020-12-31'
--  union all
-- SELECT * FROM Income LEFT JOIN Category ON Income.CategoryID = Category.CategoryID WHERE Date::timestamp > '2020-01-01' AND Date::timestamp < '2020-12-31' order by Date desc;