CREATE DATABASE cybersource;
USE cybersource;

-- Create User table
CREATE TABLE Users (
    id INT AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwords VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    family_name VARCHAR(255) NOT NULL,
    role ENUM('Read', 'Create', 'Approve') NOT NULL, -- These are the three user types. Approve and also create incidents
    PRIMARY KEY(id)
);

/*
    use a trigger stored procedure to execute everytime an INSERT occurs
    before any INSERT on Users table set a max_id variable to the current max id in the table
    this is so that the AUTO_INCREMENT keyword will increment from the current max id in the table
    and not the previous max id (even if it was deleted).
*/
DELIMITER //
CREATE TRIGGER SetAutoIncrement
BEFORE INSERT ON Users
FOR EACH ROW
BEGIN
    DECLARE max_id INT;
    SET max_id = (SELECT COALESCE(MAX(id), 0) FROM Users);
    SET NEW.id = max_id + 1;
END //
DELIMITER ;

-- Create Incident tables
CREATE TABLE Incidents (
    id INT AUTO_INCREMENT,
    version_number INT NOT NULL,
    latest_version ENUM('Yes', 'No') NOT NULL,
    date_reported VARCHAR(255) NOT NULL,
    brief_description TEXT NOT NULL,
    reported_by INT NOT NULL,
    authors TEXT,
    targets TEXT,
    attackers TEXT,
    dateAttack VARCHAR(255),
    summary TEXT,
    current_status ENUM('Pending Approval', 'Approved') NOT NULL,
    attachment_path VARCHAR(255),
    attackFlow_path VARCHAR(255),
    attackflow_json TEXT,
    PRIMARY KEY(id, version_number),
    FOREIGN KEY (reported_by) REFERENCES Users(id)
);

INSERT INTO Users (
    email,
    passwords,
    first_name,
    family_name
    ) VALUES (
    'bob@email.com',
    'password',
    "Bob",
    "Smith"
);

INSERT INTO Users (
    email,
    passwords,
    first_name,
    family_name,
    role
    ) VALUES (
    'admin@email.com',
    'password',
    "admin",
    "admin",
    "Approve"
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2022-01-01T00:00:00.000Z',
    'Fake email promising money',
    '1',
    'Approved'
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2022-03-02T00:00:00.000Z',
    'Impersonation of family member',
    '1',
    'Approved'
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2022-06-04T00:00:00.000Z',
    'Bank data compromised',
    '1',
    'Approved'
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2022-06-08T00:00:00.000Z',
    'Insurance company data leak compromised passwords',
    '1',
    'Approved'
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2022-09-09T00:00:00.000Z',
    'Local GP system breached and data obtained',
    '1',
    'Approved'
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2022-10-10T00:00:00.000Z',
    'Potential foreign agency attempting to breach Government faculty',
    '1',
    'Approved'
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2022-10-11T00:00:00.000Z',
    'User with access to system leaks data',
    '1',
    'Approved'
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2023-01-01T00:00:00.000Z',
    'Major flaw in commonly used software tool',
    '1',
    'Approved'
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2023-01-17T00:00:00.000Z',
    'Attack targeted at gen-Z',
    '1',
    'Approved'
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2023-01-20T00:00:00.000Z',
    'Exploitation of unsecure verification',
    '1',
    'Approved'
);

INSERT INTO Incidents (
    version_number,
    latest_version,
    date_reported,
    brief_description,
    reported_by,
    current_status
) VALUES (
    1,
    'Yes',
    '2023-02-11T00:00:00.000Z',
    'Potential vulnerability in the how banks store data',
    '1',
    'Approved'
);