-- Active: 1736495197968@@127.0.0.1@5432@Authen-DB
CREATE TABLE logins(
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    UNIQUE (email)
);

CREATE TABLE clientData(
    id SERIAL PRIMARY KEY,
    fName VARCHAR(255),
    lName VARCHAR(255),
    clientID INTEGER NOT NULL REFERENCES logins(id),
    UNIQUE (clientID)
);

SELECT *
FROM logins
JOIN clientData
on logins.id = clientData.clientID


SELECT * FROM logins

SELECT * FROM clientData



-- Testing insert commands
INSERT INTO logins (email, password)
VALUES ('testing1@example.com', 12345)

INSERT INTO clientData (fname, lname, clientID)
VALUES ('Testing_fname', 'Testing_lname', 1)