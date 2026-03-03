// Database Management using localStorage

// Initialize default data
export function initializeDatabase() {
    // Initialize books if not exists
    if (!localStorage.getItem('books')) {
        const defaultBooks = [
          
        ];
        localStorage.setItem('books', JSON.stringify(defaultBooks));
    }

    // Initialize members if not exists
    if (!localStorage.getItem('members')) {
        localStorage.setItem('members', JSON.stringify([]));
    }

    // Initialize transactions if not exists
    if (!localStorage.getItem('transactions')) {
        localStorage.setItem('transactions', JSON.stringify([]));
    }

    // Initialize admin credentials
    if (!localStorage.getItem('admin')) {
        const admin = {
            username: 'admin',
            password: 'admin123',
            email: 'admin@perpustakaan.com'
        };
        localStorage.setItem('admin', JSON.stringify(admin));
    }
}

// Books CRUD
export function getBooks() {
    return JSON.parse(localStorage.getItem('books') || '[]');
}

export function getBookById(id) {
    const books = getBooks();
    return books.find(book => book.id === id);
}

export function addBook(book) {
    const books = getBooks();
    book.id = Date.now().toString();
    books.push(book);
    localStorage.setItem('books', JSON.stringify(books));
    return book;
}

export function updateBook(id, updatedBook) {
    const books = getBooks();
    const index = books.findIndex(book => book.id === id);
    if (index !== -1) {
        books[index] = { ...books[index], ...updatedBook };
        localStorage.setItem('books', JSON.stringify(books));
        return books[index];
    }
    return null;
}

export function deleteBook(id) {
    const books = getBooks();
    const filteredBooks = books.filter(book => book.id !== id);
    localStorage.setItem('books', JSON.stringify(filteredBooks));
}


// Members CRUD
export function getMembers() {
    return JSON.parse(localStorage.getItem('members') || '[]');
}

export function getMemberById(id) {
    const members = getMembers();
    return members.find(member => member.id === id);
}

export function getMemberByEmail(email) {
    const members = getMembers();
    return members.find(member => member.email === email);
}

export function addMember(member) {
    const members = getMembers();
    member.id = Date.now().toString();
    member.joinDate = new Date().toISOString().split('T')[0];
    member.borrowedBooks = [];
    members.push(member);
    localStorage.setItem('members', JSON.stringify(members));
    return member;
}

export function updateMember(id, updatedMember) {
    const members = getMembers();
    const index = members.findIndex(member => member.id === id);
    if (index !== -1) {
        members[index] = { ...members[index], ...updatedMember };
        localStorage.setItem('members', JSON.stringify(members));
        return members[index];
    }
    return null;
}

export function deleteMember(id) {
    const members = getMembers();
    const filteredMembers = members.filter(member => member.id !== id);
    localStorage.setItem('members', JSON.stringify(filteredMembers));
}

// Transactions CRUD
export function getTransactions() {
    return JSON.parse(localStorage.getItem('transactions') || '[]');
}

export function addTransaction(transaction) {
    const transactions = getTransactions();
    transaction.id = Date.now().toString();
    transaction.borrowDate = new Date().toISOString().split('T')[0];
    
    // Set due date to 7 days from borrow date
    const borrowDateObj = new Date(transaction.borrowDate);
    borrowDateObj.setDate(borrowDateObj.getDate() + 7);
    transaction.dueDate = borrowDateObj.toISOString().split('T')[0];
    
    transaction.returnDate = null;
    transaction.status = 'borrowed';
    transaction.fine = 0;
    transaction.finePaid = false;
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Update member's borrowed books
    const member = getMemberById(transaction.memberId);
    if (member) {
        if (!member.borrowedBooks) {
            member.borrowedBooks = [];
        }
        member.borrowedBooks.push(transaction.bookId);
        updateMember(member.id, member);
    }

    // Decrease book stock
    const book = getBookById(transaction.bookId);
    if (book) {
        book.stock -= 1;
        updateBook(book.id, book);
    }

    return transaction;
}

export function returnBook(transactionId) {
    const transactions = getTransactions();
    const index = transactions.findIndex(t => t.id === transactionId);
    if (index !== -1) {
        transactions[index].returnDate = new Date().toISOString().split('T')[0];
        transactions[index].status = 'returned';
        localStorage.setItem('transactions', JSON.stringify(transactions));

        // Update member's borrowed books
        const transaction = transactions[index];
        const member = getMemberById(transaction.memberId);
        if (member && member.borrowedBooks) {
            member.borrowedBooks = member.borrowedBooks.filter(bookId => bookId !== transaction.bookId);
            updateMember(member.id, member);
        }

        // Increase book stock
        const book = getBookById(transaction.bookId);
        if (book) {
            book.stock += 1;
            updateBook(book.id, book);
        }

        return transactions[index];
    }
    return null;
}

export function getActiveBorrowsByMember(memberId) {
    const transactions = getTransactions();
    return transactions.filter(t => t.memberId === memberId && t.status === 'borrowed');
}

export function getTransactionById(id) {
    const transactions = getTransactions();
    return transactions.find(t => t.id === id);
}

export function getTransactionsByMemberId(memberId) {
    const transactions = getTransactions();
    return transactions.filter(t => t.memberId === memberId);
}

export function getTransactionsByBookId(bookId) {
    const transactions = getTransactions();
    return transactions.filter(t => t.bookId === bookId);
}

export function updateTransaction(id, updatedTransaction) {
    const transactions = getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updatedTransaction };
        localStorage.setItem('transactions', JSON.stringify(transactions));
        return transactions[index];
    }
    return null;
}

export function deleteTransaction(id) {
    const transactions = getTransactions();
    const transaction = transactions.find(t => t.id === id);
    
    if (transaction) {
        // Restore member's borrowed books
        const member = getMemberById(transaction.memberId);
        if (member && member.borrowedBooks) {
            member.borrowedBooks = member.borrowedBooks.filter(bookId => bookId !== transaction.bookId);
            updateMember(member.id, member);
        }

        // Restore book stock
        const book = getBookById(transaction.bookId);
        if (book) {
            book.stock += 1;
            updateBook(book.id, book);
        }

        const filteredTransactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(filteredTransactions));
        return true;
    }
    return false;
}

// Fine Management
export function getFineSettings() {
    const settings = localStorage.getItem('fineSettings');
    if (!settings) {
        // Default settings: Rp 5000 per week
        const defaultSettings = {
            finePerWeek: 5000,
            borrowDurationDays: 7
        };
        localStorage.setItem('fineSettings', JSON.stringify(defaultSettings));
        return defaultSettings;
    }
    return JSON.parse(settings);
}

export function updateFineSettings(settings) {
    localStorage.setItem('fineSettings', JSON.stringify(settings));
    return settings;
}

export function calculateFine(transactionId) {
    const transaction = getTransactionById(transactionId);
    if (!transaction || transaction.status === 'returned' || transaction.finePaid) {
        return 0;
    }

    const today = new Date();
    const dueDate = new Date(transaction.dueDate);
    
    // If not overdue, no fine
    if (today <= dueDate) {
        return 0;
    }

    // Calculate days overdue
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const settings = getFineSettings();
    
    // Calculate weeks overdue (round up) and multiply by fine per week
    const weeksOverdue = Math.ceil(daysOverdue / 7);
    const fine = weeksOverdue * settings.finePerWeek;

    // Update transaction with calculated fine
    updateTransaction(transactionId, { fine });
    
    return fine;
}

export function getMemberFines(memberId) {
    const transactions = getTransactions();
    const memberTransactions = transactions.filter(t => t.memberId === memberId);
    
    let totalFine = 0;
    let unpaidFines = [];

    memberTransactions.forEach(transaction => {
        if (transaction.status === 'borrowed' && !transaction.finePaid) {
            const fine = calculateFine(transaction.id);
            if (fine > 0) {
                totalFine += fine;
                unpaidFines.push({
                    transactionId: transaction.id,
                    bookTitle: getBookById(transaction.bookId)?.title,
                    dueDate: transaction.dueDate,
                    fine: fine
                });
            }
        }
    });

    return {
        totalFine,
        unpaidFines
    };
}

export function markFinePaid(transactionId) {
    return updateTransaction(transactionId, { finePaid: true });
}

export function updateTransactionDueDate(transactionId, newDueDate) {
    return updateTransaction(transactionId, { dueDate: newDueDate });
}

// Admin authentication
export function validateAdmin(email, password) {
    const admin = JSON.parse(localStorage.getItem('admin'));
    return admin && (admin.email === email || admin.username === email) && admin.password === password;
}

// Member authentication
export function validateMember(email, password) {
    const member = getMemberByEmail(email);
    return member && member.password === password ? member : null;
}

// Statistics
export function getStatistics() {
    const books = getBooks();
    const members = getMembers();
    const transactions = getTransactions();
    const activeBorrows = transactions.filter(t => t.status === 'borrowed');

    return {
        totalBooks: books.length,
        totalMembers: members.length,
        activeBorrows: activeBorrows.length
    };
}

// Initialize database on load
initializeDatabase();