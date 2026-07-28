# UAT Results
# Web App Test Results
  -  Test Case ID: TC002
    Description: Web Payment Screen
    Status: Wrong Screen
    Comments: In Web App, payment still listing MTN and Airtel Mobile Money option. These are currently catered for in pesapal

  -  Test Case ID: TC003
    Description: QR CODE after payments
    Status: Incomplete data
    Comments: QR code that is displayed in the payment receipt shows an empty box without qr code. 

-  Test Case ID: TC004
    Description: Scanning QR code
    Status: Fail
    Comments: QR code scanning is not working. Shows "Validation Failed: This appears to be route selection QR code. To validate a passenger ticket, you nrrf the QR code from a complete booking. Ask the passenger to show their booking confirmation QR Code". We are scanning a QR code that was generated after the completion of payment

-  Test Case ID: TC005
    Description: No where to download Ticket or view completed bookings
    Status: incomplete
    Comments: In the web portal, the customer/user has no way to viewing/downloading ticket details. When they try to download ticket it doesn't generate a ticket

- Test Code ID: TC006
Description: QR Code scanning for passenger/customer(using any scanner)
Status: Not working well
Comment: When customer scans the QR code. It shows an array/json format data instead of the ticket information. 

- Test Code ID: TC007
Description: QR Code Camera Scanning for Operator
Status: Not working well
Comment: When operator try to scan ticket from the QR Camera Scans. It scans and closes immediately. This prevents the camera from capture the code well, however when scanned well(full code). When the full ticket is scanned. It shows the result of the ticket.

Path: https://admin.transconnect.app/qr-scanner 
Camera Scanner scans briefly and closes

- Test Code ID: TC008
Description: QR Scan Result
Status: working
Comment: The result of the Ticket Validator is showing at the bottom the the page which is sometimes hard to view. This makes one assume that the scan didn't work. 
Path: https://admin.transconnect.app/qr-scanner 
Camera Scanner scans briefly and closes

- Test Code ID: TC009
Description: View Ticket(Web Portal)
Status: working
Comment: The result of the Ticket Validator is showing at the bottom the the page which is sometimes hard to view. This makes one assume that the scan didn't work. 
Path: https://transconnect.app/bookings -> view Ticket (https://transconnect.app/bookings/cmr8yfd7200027bsojyazpbt6)

Result: Booking Not Found
Failed to fetch booking details 


# Issues to work on for web Testing
- Test Code ID: TC010
Description: Cancellation is failing
Status: Failed
Comment: Tried to cancel a booking that expired and its generating the error below.
Error: Cancellation Failed: Cannot cancel booking less than 2 hours before travel
Booking Url: https://transconnect.app/bookings/cmr97f3hy000j10o0yv2tj4l5

- Test Code ID: TC011
Description: Download of ticket not working
Status: Failed(Unresponsive)
Comment: When "Cash Payment(Over the Counter)" is selected, it leads to the Digital Ticket screen, however the option to download ticket correctly brings a message "Do you want to download "transconnect-ticket-[ticket-number]" but the options(View/Download) are not responsive.
Error: No response to the ticket
Booking Url: https://transconnect.app/booking-success?booking=%7B%22id%22%3A%22cmrai0zey001rs8wode31j7pz%22%2C%22totalAmount%22%3A30000%2C%22route%22%3A%7B%22origin%22%3A%22Origin%22%2C%22destination%22%3A%22Destination%22%7D%2C%22travelDate%22%3A%222026-07-07%22%2C%22seatNumber%22%3A%2220%22%2C%22passengers%22%3A%5B%7B%22name%22%3A%22Stephen%20Omwony%22%2C%22seatNumber%22%3A%2220%22%7D%5D%2C%22pricePerSeat%22%3A30000%2C%22boardingStop%22%3A%22%22%2C%22alightingStop%22%3A%22%22%2C%22qrCode%22%3A%22data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAKQAAACkCAYAAAAZtYVBAAAAAklEQVR4AewaftIAAAY0SURBVO3BQW4ky5LAQDKg%2B1%2BZ00tfJVDIkibeh5vZP6x1icNaFzmsdZHDWhc5rHWRw1oXOax1kcNaFzmsdZHDWhc5rHWRw1oXOax1kcNaFzmsdZHDWhf54SWVv1QxqTypeKIyVXxCZaqYVN6omFSmiicqf6nijcNaFzmsdZHDWhf54csqvknlN1U8UZkqnqhMFU9U3lCZKp5UfJPKNx3WushhrYsc1rrID79M5RMVn6iYVJ6oTBWTyhOVJxWTylTxpGJSeVLxhsonKn7TYa2LHNa6yGGti%2FzwH6cyVUwqU8WkMlW8oTJVTCpvVPwvO6x1kcNaFzmsdZEf%2FuMqPqHyTSr%2Fn1Smiv%2Byw1oXOax1kcNaF%2Fnhl1X8JZWp4onKpPJGxRsqf6niJoe1LnJY6yKHtS7yw5ep%2FCWVqWJSmSqeVEwqU8Wk8kRlqphUpopJ5ZtUbnZY6yKHtS5yWOsi9g%2F%2FYSpPKiaVJxVPVH5TxaTypOJ%2FyWGtixzWushhrYv88JLKVDGpPKmYVD5RMalMKlPFpPJE5TdVTCpTxROVqWJSmSqeqEwVk8qTijcOa13ksNZFDmtd5IeXKiaVqWJSmVSeVDxR%2BYTKVDGpPKmYVJ5UTCpvqEwVn1CZKp6oTBWTyjcd1rrIYa2LHNa6yA9fVjGpPKl4ojJVTBWfUJlUnlR8ouJJxaTymyomlUnlScWk8psOa13ksNZFDmtd5IcvU3lS8URlqphUpoonKlPFGypvqDyp%2BITKGxWTypOKSeWbDmtd5LDWRQ5rXeSHL6v4hMpUMam8UfFEZaqYVD6h8qRiUnmjYlKZKp6ovFHxTYe1LnJY6yKHtS5i%2F%2FCCyhsVk8pU8YbKk4onKlPFE5XfVPGGylTxROVJxTcd1rrIYa2LHNa6iP3D%2FyOVqWJSmSreUJkq%2FpLKJyreUJkqJpUnFX%2FpsNZFDmtd5LDWRewfvkhlqvhNKlPFE5Wp4onKk4onKlPFpPKJiknljYpJ5UnFbzqsdZHDWhc5rHWRH15SeaIyVUwqn6iYKp6ofELlScU3VUwqT1SmiknlScWkMlVMKn%2FpsNZFDmtd5LDWRX54qWJSmSqeVHxC5UnFk4pPVEwqU8UbKm%2BoTBWTyidUpopJ5UnFG4e1LnJY6yKHtS7yw0sqT1SeVDxReaPiicpUMak8UXlS8UbFJ1SmiknlScWk8qTimw5rXeSw1kUOa13kh5cqJpU3VKaKSWWqmFSmiknljYonKpPKJyqeqEwVT1SmiknlScWk8psOa13ksNZFDmtdxP7h%2F5HKVDGpTBWfUJkqnqj8pYpJZap4ojJVPFGZKiaVJxWTylTxxmGtixzWushhrYv88JLKVDGpPKmYVKaKSWWqmFSmiicq31TxRGVSmSomlU%2BovFExqfylw1oXOax1kcNaF7F%2F%2BEUqU8Wk8pcqnqhMFZPKVDGpTBVPVN6omFQ%2BUTGpvFHxxmGtixzWushhrYv88GUqT1Q%2BUTGpvKEyVTxR%2BUTFE5UnFZPKVPGJijcq%2FtJhrYsc1rrIYa2L%2FPCSylQxqUwVn1CZKp6oTBWTyicqPqHypOKbVJ6ofKLiEypTxRuHtS5yWOsih7UuYv%2FwH6bypOKJylQxqbxRMalMFZ9QeVLxCZUnFX%2FpsNZFDmtd5LDWRX54SeUvVTyp%2BETFk4onKlPFJ1SeVLyhMlU8qXiiMlV802GtixzWushhrYv88GUV36TyhspUMak8qZhUPqEyVUwqT1TeqPiEypOK33RY6yKHtS5yWOsiP%2FwylU9UfKJiUpkqJpWpYlJ5UnEzlTcqJpVJ5UnFG4e1LnJY6yKHtS7yw3%2BcyhOVqWJSeUPlL1VMKlPFE5Wp4knFE5VvOqx1kcNaFzmsdZEf%2FsdUTCpvqDypmFSmik9UTCqfUHlD5UnFVPFNh7UucljrIoe1LvLDL6v4TRVvVEwqU8Wk8gmVJxVPKj5R8URlUpkqPqEyVbxxWOsih7UucljrIj98mcpfUpkqpoonKlPFpPJNFU9UpoonFZ%2BomFSeqEwVU8U3Hda6yGGtixzWuoj9w1qXOKx1kcNaFzmsdZHDWhc5rHWRw1oXOax1kcNaFzmsdZHDWhc5rHWRw1oXOax1kcNaFzmsdZH%2FA9Wq75JFasl%2BAAAAAElFTkSuQmCC%22%2C%22paymentStatus%22%3A%22PENDING%22%2C%22paymentMethod%22%3A%22CASH%22%2C%22isCashPayment%22%3Atrue%2C%22paymentRef%22%3A%22CASH-cmrai0zey001rs8wode31j7pz%22%7D

- Test Code ID: TC012
Description: Request Transfer is failling
Status: Fails
Comment: Clicking on the "Request Transfer" link brings "404 | This page could not be found."

- Test Code ID: TC013
Description: Download QR Code fails via the web portal fails on IOS but works on computer and android web
Status: Fails
Comment: Download QR Code fails via the web portal fails on IOS but works on computer and android web
Error: No response .

- Test Code ID: TC014
Description: Booking for two tickets
Status: Inconsistent
Comment: When we book for two tickets and checkout to pay, only price for one ticket is shown. This is happenning for both Cash Payment and PesaPal payment.
Error: No error but system is not working as expected.

- Test Code ID: TC015
Description: New added route not showing in the app
Status: Inconsistent
Comment: We added a new route FOR UA438UB. It isn't appearing when you search for route however it is there in the route. This is happening for both MobileApp and web app.
payment.
Error: No error but system is not working as expected.

- Test Code ID: TC016
Description: Route listing for mobile apps
Status: Not there
Comment: Mobile app doesn't have route listing. Users have to enter the routes which is fine but i think there is need for route listing.
payment.
Error: No error but system is not working as expected.