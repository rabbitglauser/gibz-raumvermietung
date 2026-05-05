
# Mockups Documentation


## Purpose

This document describes the UI mockups for the **Raumvermietung** project and links to the Figma design file used for review, frontend planning, and implementation guidance.

The mockups were created to validate:

- the overall user interface
- the main reservation flow
- usability before implementation
- clear input forms for customers
- internal administration workflows
- filtering and overview pages for employees


### Figma Design File

[Open the Figma design file](https://www.figma.com/design/dU7SgQ4GXlvGvDLVR3grMB/Mockup-Raumvermietung?node-id=0-1&t=6IvJr2GYRiIAHcrM-1)

---

## Project Context

**Raumvermietung** is a web-based room reservation system for GIBZ.

Currently, customers reserve rooms using PDF forms that are filled out manually and sent to the secretariat by email. If catering is needed, the Restaurant Treff is informed separately. If special room setup or material is required, the house service also has to be informed manually.

The goal of the web application is to digitalize and simplify this process.

The application should support:

- room information and room availability
- online room reservations
- automatic validation of user input
- later editing of reservations by customers
- catering information
- room setup options
- additional material requests
- automatic reminders for missing information
- internal reservation management for staff
- filtering and overview pages for different employee roles

---

## Target Users

The mockups were designed for the following user groups:

- **Customer** – views available rooms and creates a reservation
- **Secretariat** – manages reservations and prepares billing-related information
- **House Service** – checks upcoming reservations, room setup, and required material
- **Restaurant Treff** – checks reservations that include catering or refreshments
- **Admin / Staff User** – manages reservations, rooms, settings, and system data

### UX Priorities

The design focuses on:

- simple and clear input forms
- fast reservation creation
- understandable error messages
- reduced administrative effort
- good readability
- clear separation between customer and employee views
- easy filtering for staff members
- low cognitive load for non-technical users

---


## Navigation and Contexts

The mockups consider two main application contexts:

### Customer Context

Used for:

- viewing room information
- creating a reservation
- completing missing information
- updating reservation details before the deadline

### Employee Context

Used for:

- managing all reservations
- preparing rooms
- preparing catering
- checking upcoming events
- checking past reservations for billing
- maintaining room and system data

Navigation is represented through:

- simple customer-facing page navigation
- internal dashboard navigation
- overview pages with filters
- detail pages for specific reservations

---

## Important Design Decisions

The mockups intentionally keep the interface simple and task-focused.

### 1. Replacement of PDF Forms

The reservation form is designed to replace the old PDF process.

Instead of manually filling out and sending PDFs by email, customers can enter their reservation directly in the web application.

### 2. Simple Initial Reservation

Customers do not need to provide every detail immediately.

At first, only the most important information is required:

- room
- date
- start and end time
- contact details

This reduces friction and allows customers to reserve a room even if some event details are not final yet.

### 3. Later Completion of Missing Information

The design supports the idea that customers can complete missing details later.

This is important for information such as:

- participant count
- catering
- seating arrangement
- additional equipment
- special requirements

### 4. Clear Validation and Error Feedback

The mockups support clear feedback for invalid or missing entries.

Examples:

- required fields
- invalid date or time formats
- unavailable reservation times
- missing catering or setup information
- conflicting room bookings

### 5. Employee-Specific Views

The internal area is separated from the customer-facing reservation flow.

Each employee group needs quick access to different information:

- the **secretariat** needs reservation and billing information
- the **house service** needs upcoming room setup and material requirements
- **Restaurant Treff** needs catering-related reservations
- admins need overall management options

### 6. Flexible Reminder and Deadline Logic

The mockups reflect that reminders and deadlines should not be hardcoded.

The system should allow configurable deadlines for when customers must complete missing information before the event.

---

## Business Rules Reflected in the Mockups

The mockups align with the current requirements of the project:

- customers can reserve rooms independently
- reservations are only possible during available times
- a room cannot be double-booked for the same time period
- customers can edit reservations until a configurable deadline before the event
- catering, room setup, and material information must be completed before the deadline
- customers should be reminded automatically when required information is missing
- employees can manually manage reservations
- reservations can be filtered by different operational criteria
- user input must be validated before saving
- errors must be displayed in a clear and understandable way

---

## Relation to Implementation

The mockups are used as a visual planning reference for the frontend implementation.

They help define:

- page structure
- user flows
- required form fields
- navigation logic
- role-specific views
- validation states
- important UI components

The implementation may differ slightly from the mockups if technical constraints, database structure, or project scope require changes.

---

## Possible Future Improvements

The following features could be added or extended later:

- automatic email confirmation after reservation
- automatic reminder emails for missing information
- calendar view for room availability
- admin settings for reminder deadlines
- export of reservations for billing
- role-based access control
- improved dashboard statistics
- notification overview for employees
- status tracking for each reservation
- backup and restore interface for the database

---

## Summary

The Figma mockups define the planned user experience for the **Raumvermietung** web application.

They show how the current manual reservation process can be transformed into a digital workflow that is easier for customers and more efficient for GIBZ employees.

The main focus of the design is:

- clear room reservation
- simple customer input
- later completion of missing details
- automatic reminders
- employee-friendly management views
- fast filtering and preparation workflows
- a clean and understandable interface
```
