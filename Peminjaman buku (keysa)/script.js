import {
    getBooks,
    getBookById,
    addBook,
    updateBook,
    deleteBook,
    getMembers,
    getMemberById,
    addMember,
    updateMember,
    deleteMember,
    getTransactions,
    getTransactionById,
    getTransactionsByMemberId,
    getTransactionsByBookId,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    returnBook,
    getActiveBorrowsByMember,
    validateAdmin,
    validateMember,
    getStatistics,
    getFineSettings,
    updateFineSettings,
    calculateFine,
    getMemberFines,
    markFinePaid,
    updateTransactionDueDate
} from './database.js';

// Global state
let currentUser = null;
let currentRole = null;
let editingBookId = null;
let editingMemberId = null;
let editingTransactionId = null;

// Page navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

window.showLanding = function() {
    showPage('landingPage');
};

window.showLogin = function(role) {
    currentRole = role;
    showPage('loginPage');
    
    const title = document.getElementById('loginTitle');
    const registerLink = document.getElementById('registerLink');
    
    if (role === 'admin') {
        title.textContent = 'Login Admin';
        registerLink.style.display = 'none';
    } else {
        title.textContent = 'Login User';
        registerLink.style.display = 'block';
    }
    
    document.getElementById('loginForm').reset();
};

window.showRegister = function() {
    showPage('registerPage');
    document.getElementById('registerForm').reset();
};

// Authentication
window.handleLogin = function(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (currentRole === 'admin') {
        if (validateAdmin(email, password)) {
            currentUser = { email, role: 'admin' };
            showAdminDashboard();
            showToast('Login berhasil! Selamat datang Admin', 'success');
        } else {
            showToast('Email atau password admin salah!', 'error');
        }
    } else {
        const member = validateMember(email, password);
        if (member) {
            currentUser = { ...member, role: 'user' };
            showUserDashboard();
            showToast(`Selamat datang, ${member.name}!`, 'success');
        } else {
            showToast('Email atau password salah!', 'error');
        }
    }
};

window.handleRegister = function(event) {
    event.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value;
    const address = document.getElementById('regAddress').value;
    
    // Check if email already exists
    const members = getMembers();
    if (members.find(m => m.email === email)) {
        showToast('Email sudah terdaftar!', 'error');
        return;
    }
    
    const newMember = {
        name,
        email,
        password,
        phone,
        address
    };
    
    addMember(newMember);
    showToast('Registrasi berhasil! Silakan login', 'success');
    showLogin('user');
};

window.logout = function() {
    currentUser = null;
    currentRole = null;
    showLanding();
    showToast('Logout berhasil', 'success');
};

// Admin Dashboard
function showAdminDashboard() {
    showPage('adminPage');
    document.getElementById('adminName').textContent = currentUser.email;
    updateAdminStats();
    loadBooksTable();
    showAdminTab('books');
}

function updateAdminStats() {
    const stats = getStatistics();
    document.getElementById('totalBooks').textContent = stats.totalBooks;
    document.getElementById('totalMembers').textContent = stats.totalMembers;
    document.getElementById('activeBorrows').textContent = stats.activeBorrows;
}

window.showAdminTab = function(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'books') {
        document.getElementById('booksTab').classList.add('active');
        loadBooksTable();
    } else if (tabName === 'members') {
        document.getElementById('membersTab').classList.add('active');
        loadMembersTable();
    } else if (tabName === 'transactions') {
        document.getElementById('transactionsTab').classList.add('active');
        loadTransactionsTable();
    } else if (tabName === 'fines') {
        document.getElementById('finesTab').classList.add('active');
        loadFinesManagement();
    }
};

// Books Management
function loadBooksTable() {
    const books = getBooks();
    const tbody = document.getElementById('booksTableBody');
    
    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Belum ada buku</td></tr>';
        return;
    }
    
    tbody.innerHTML = books.map(book => `
        <tr>
            <td><img src="${book.cover}" alt="${book.title}" class="book-cover-small"></td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.publisher}</td>
            <td>${book.genre}</td>
            <td>${book.isbn}</td>
            <td>${book.stock}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editBook('${book.id}')" class="btn btn-primary btn-small">Edit</button>
                    <button onclick="confirmDeleteBook('${book.id}')" class="btn btn-danger btn-small">Hapus</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.searchAdminBooks = function() {
    const searchTerm = document.getElementById('adminBookSearch').value.toLowerCase();
    const books = getBooks();
    const filtered = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.genre.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('booksTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Tidak ada buku ditemukan</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(book => `
        <tr>
            <td><img src="${book.cover}" alt="${book.title}" class="book-cover-small"></td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.publisher}</td>
            <td>${book.genre}</td>
            <td>${book.isbn}</td>
            <td>${book.stock}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editBook('${book.id}')" class="btn btn-primary btn-small">Edit</button>
                    <button onclick="confirmDeleteBook('${book.id}')" class="btn btn-danger btn-small">Hapus</button>
                </div>
            </td>
        </tr>
    `).join('');
};

window.showAddBookModal = function() {
    editingBookId = null;
    document.getElementById('bookModalTitle').textContent = 'Tambah Buku';
    document.getElementById('bookForm').reset();
    document.getElementById('coverPreview').innerHTML = '';
    document.getElementById('bookModal').classList.add('active');
};

window.editBook = function(bookId) {
    editingBookId = bookId;
    const book = getBookById(bookId);
    
    document.getElementById('bookModalTitle').textContent = 'Edit Buku';
    document.getElementById('bookId').value = book.id;
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookAuthor').value = book.author;
    document.getElementById('bookPublisher').value = book.publisher;
    document.getElementById('bookGenre').value = book.genre;
    document.getElementById('bookISBN').value = book.isbn;
    document.getElementById('bookStock').value = book.stock;
    document.getElementById('bookDescription').value = book.description || '';

    
    if (book.cover) {
        document.getElementById('coverPreview').innerHTML = `<img src="${book.cover}" alt="Cover">`;
    }
    
    document.getElementById('bookModal').classList.add('active');
};

window.closeBookModal = function() {
    document.getElementById('bookModal').classList.remove('active');
    editingBookId = null;
};

window.previewCover = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('coverPreview').innerHTML = `<img src="${e.target.result}" alt="Cover Preview">`;
        };
        reader.readAsDataURL(file);
    }
};

window.handleBookSubmit = function(event) {
    event.preventDefault();
    
    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        publisher: document.getElementById('bookPublisher').value,
        genre: document.getElementById('bookGenre').value,
        isbn: document.getElementById('bookISBN').value,
        stock: parseInt(document.getElementById('bookStock').value),
        description: document.getElementById('bookDescription').value,
        cover: 'https://mgx-backend-cdn.metadl.com/generate/images/962196/2026-02-09/3868a3af-e99c-4d11-92b1-b485c75c0eb8.png'
    };
    
    // Handle cover upload
    const coverInput = document.getElementById('bookCover');
    if (coverInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bookData.cover = e.target.result;
            saveBook(bookData);
        };
        reader.readAsDataURL(coverInput.files[0]);
    } else {
        if (editingBookId) {
            const existingBook = getBookById(editingBookId);
            bookData.cover = existingBook.cover;
        }
        saveBook(bookData);
    }
};

function saveBook(bookData) {
    if (editingBookId) {
        updateBook(editingBookId, bookData);
        showToast('Buku berhasil diupdate!', 'success');
    } else {
        addBook(bookData);
        showToast('Buku berhasil ditambahkan!', 'success');
    }
    
    closeBookModal();
    loadBooksTable();
    updateAdminStats();
}

window.confirmDeleteBook = function(bookId) {
    if (confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
        deleteBook(bookId);
        showToast('Buku berhasil dihapus!', 'success');
        loadBooksTable();
        updateAdminStats();
    }
};

// Members Management
function loadMembersTable() {
    const members = getMembers();
    const tbody = document.getElementById('membersTableBody');
    
    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Belum ada anggota</td></tr>';
        return;
    }
    
    tbody.innerHTML = members.map(member => `
        <tr>
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${member.phone}</td>
            <td>${member.address}</td>
            <td>${member.joinDate}</td>
            <td>${member.borrowedBooks ? member.borrowedBooks.length : 0}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editMember('${member.id}')" class="btn btn-primary btn-small">Edit</button>
                    <button onclick="confirmDeleteMember('${member.id}')" class="btn btn-danger btn-small">Hapus</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.searchMembers = function() {
    const searchTerm = document.getElementById('memberSearch').value.toLowerCase();
    const members = getMembers();
    const filtered = members.filter(member => 
        member.name.toLowerCase().includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('membersTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Tidak ada anggota ditemukan</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(member => `
        <tr>
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${member.phone}</td>
            <td>${member.address}</td>
            <td>${member.joinDate}</td>
            <td>${member.borrowedBooks ? member.borrowedBooks.length : 0}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editMember('${member.id}')" class="btn btn-primary btn-small">Edit</button>
                    <button onclick="confirmDeleteMember('${member.id}')" class="btn btn-danger btn-small">Hapus</button>
                </div>
            </td>
        </tr>
    `).join('');
};

window.showAddMemberModal = function() {
    editingMemberId = null;
    document.getElementById('memberModalTitle').textContent = 'Tambah Anggota';
    document.getElementById('memberForm').reset();
    document.getElementById('memberModal').classList.add('active');
};

window.editMember = function(memberId) {
    editingMemberId = memberId;
    const member = getMemberById(memberId);
    
    document.getElementById('memberModalTitle').textContent = 'Edit Anggota';
    document.getElementById('memberId').value = member.id;
    document.getElementById('memberName').value = member.name;
    document.getElementById('memberEmail').value = member.email;
    document.getElementById('memberPassword').value = member.password;
    document.getElementById('memberPhone').value = member.phone;
    document.getElementById('memberAddress').value = member.address;
    
    document.getElementById('memberModal').classList.add('active');
};

window.closeMemberModal = function() {
    document.getElementById('memberModal').classList.remove('active');
    editingMemberId = null;
};

window.handleMemberSubmit = function(event) {
    event.preventDefault();
    
    const memberData = {
        name: document.getElementById('memberName').value,
        email: document.getElementById('memberEmail').value,
        password: document.getElementById('memberPassword').value,
        phone: document.getElementById('memberPhone').value,
        address: document.getElementById('memberAddress').value
    };
    
    if (editingMemberId) {
        updateMember(editingMemberId, memberData);
        showToast('Anggota berhasil diupdate!', 'success');
    } else {
        // Check if email already exists
        const members = getMembers();
        if (members.find(m => m.email === memberData.email)) {
            showToast('Email sudah terdaftar!', 'error');
            return;
        }
        addMember(memberData);
        showToast('Anggota berhasil ditambahkan!', 'success');
    }
    
    closeMemberModal();
    loadMembersTable();
    updateAdminStats();
};

window.confirmDeleteMember = function(memberId) {
    const member = getMemberById(memberId);
    if (member.borrowedBooks && member.borrowedBooks.length > 0) {
        showToast('Tidak dapat menghapus anggota yang masih meminjam buku!', 'error');
        return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
        deleteMember(memberId);
        showToast('Anggota berhasil dihapus!', 'success');
        loadMembersTable();
        updateAdminStats();
    }
};

// Transactions Management
function loadTransactionsTable() {
    const transactions = getTransactions();
    const tbody = document.getElementById('transactionsTableBody');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Belum ada transaksi</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(transaction => {
        const member = getMemberById(transaction.memberId);
        const book = getBookById(transaction.bookId);
        const statusClass = transaction.status === 'borrowed' ? 'badge-warning' : 'badge-success';
        const statusText = transaction.status === 'borrowed' ? 'Dipinjam' : 'Dikembalikan';
        
        return `
            <tr>
                <td>${transaction.id}</td>
                <td>${member ? member.name : 'Unknown'}</td>
                <td>${book ? book.title : 'Unknown'}</td>
                <td>${transaction.borrowDate}</td>
                <td>${transaction.returnDate || '-'}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="editTransaction('${transaction.id}')" class="btn btn-primary btn-small">Edit</button>
                        <button onclick="confirmReturnBook('${transaction.id}')" class="btn btn-warning btn-small" ${transaction.status === 'returned' ? 'disabled' : ''}>Kembali</button>
                        <button onclick="confirmDeleteTransaction('${transaction.id}')" class="btn btn-danger btn-small">Hapus</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.showAddTransactionModal = function() {
    editingTransactionId = null;
    document.getElementById('transactionModalTitle').textContent = 'Tambah Transaksi';
    document.getElementById('transactionForm').reset();
    
    // Load members
    const members = getMembers();
    const memberSelect = document.getElementById('transactionMember');
    memberSelect.innerHTML = '<option value="">Pilih Anggota</option>' + 
        members.map(m => `<option value="${m.id}">${m.name} (${m.email})</option>`).join('');
    
    // Load books
    const books = getBooks();
    const bookSelect = document.getElementById('transactionBook');
    bookSelect.innerHTML = '<option value="">Pilih Buku</option>' + 
        books.filter(b => b.stock > 0).map(b => `<option value="${b.id}">${b.title} (Stok: ${b.stock})</option>`).join('');
    
    // Set today's date as borrow date
    document.getElementById('transactionBorrowDate').valueAsDate = new Date();
    
    document.getElementById('transactionModal').classList.add('active');
};

window.editTransaction = function(transactionId) {
    editingTransactionId = transactionId;
    const transaction = getTransactionById(transactionId);
    
    if (!transaction) {
        showToast('Transaksi tidak ditemukan', 'error');
        return;
    }
    
    document.getElementById('transactionModalTitle').textContent = 'Edit Transaksi';
    document.getElementById('transactionId').value = transaction.id;
    
    // Load members
    const members = getMembers();
    const memberSelect = document.getElementById('transactionMember');
    memberSelect.innerHTML = '<option value="">Pilih Anggota</option>' + 
        members.map(m => `<option value="${m.id}" ${transaction.memberId === m.id ? 'selected' : ''}>${m.name} (${m.email})</option>`).join('');
    memberSelect.disabled = true; // Disable member selection during edit
    
    // Load books
    const books = getBooks();
    const bookSelect = document.getElementById('transactionBook');
    bookSelect.innerHTML = '<option value="">Pilih Buku</option>' + 
        books.map(b => `<option value="${b.id}" ${transaction.bookId === b.id ? 'selected' : ''}>${b.title}</option>`).join('');
    bookSelect.disabled = true; // Disable book selection during edit
    
    document.getElementById('transactionBorrowDate').value = transaction.borrowDate;
    document.getElementById('transactionBorrowDate').disabled = true;
    
    document.getElementById('transactionReturnDate').value = transaction.returnDate || '';
    document.getElementById('transactionStatus').value = transaction.status;
    
    document.getElementById('transactionModal').classList.add('active');
};

window.closeTransactionModal = function() {
    document.getElementById('transactionModal').classList.remove('active');
    document.getElementById('transactionMember').disabled = false;
    document.getElementById('transactionBook').disabled = false;
    document.getElementById('transactionBorrowDate').disabled = false;
    editingTransactionId = null;
};

window.handleTransactionSubmit = function(event) {
    event.preventDefault();
    
    const memberId = document.getElementById('transactionMember').value;
    const bookId = document.getElementById('transactionBook').value;
    const borrowDate = document.getElementById('transactionBorrowDate').value;
    const returnDate = document.getElementById('transactionReturnDate').value;
    const status = document.getElementById('transactionStatus').value;
    
    if (!memberId || !bookId) {
        showToast('Silakan pilih anggota dan buku', 'error');
        return;
    }
    
    if (editingTransactionId) {
        // Update transaction
        const updated = updateTransaction(editingTransactionId, {
            returnDate: returnDate || null,
            status: status
        });
        
        if (updated) {
            showToast('Transaksi berhasil diperbarui', 'success');
            loadTransactionsTable();
            closeTransactionModal();
        } else {
            showToast('Gagal memperbarui transaksi', 'error');
        }
    } else {
        // Add new transaction
        const newTransaction = addTransaction({
            memberId,
            bookId
        });
        
        if (newTransaction) {
            showToast('Transaksi berhasil ditambahkan', 'success');
            loadTransactionsTable();
            closeTransactionModal();
        } else {
            showToast('Gagal menambahkan transaksi', 'error');
        }
    }
};

window.confirmReturnBook = function(transactionId) {
    if (confirm('Apakah Anda yakin ingin mengembalikan buku ini?')) {
        const returned = returnBook(transactionId);
        if (returned) {
            showToast('Buku berhasil dikembalikan', 'success');
            loadTransactionsTable();
        } else {
            showToast('Gagal mengembalikan buku', 'error');
        }
    }
};

window.confirmDeleteTransaction = function(transactionId) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        const deleted = deleteTransaction(transactionId);
        if (deleted) {
            showToast('Transaksi berhasil dihapus', 'success');
            loadTransactionsTable();
        } else {
            showToast('Gagal menghapus transaksi', 'error');
        }
    }
};

// Fine Management
function loadFinesManagement() {
    // Load fine settings
    const settings = getFineSettings();
    document.getElementById('finePerWeek').value = settings.finePerWeek;
    document.getElementById('borrowDuration').value = settings.borrowDurationDays;
    
    // Load overdue transactions
    const transactions = getTransactions();
    const overdueTransactions = transactions.filter(t => {
        if (t.status === 'returned' || t.finePaid) return false;
        const today = new Date().toISOString().split('T')[0];
        return today > t.dueDate;
    });
    
    const tbody = document.getElementById('finesTableBody');
    
    if (overdueTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Tidak ada transaksi overdue</td></tr>';
        return;
    }
    
    tbody.innerHTML = overdueTransactions.map(transaction => {
        const member = getMemberById(transaction.memberId);
        const book = getBookById(transaction.bookId);
        const fine = calculateFine(transaction.id);
        const paidStatus = transaction.finePaid ? '✓ Sudah Dibayar' : '❌ Belum Dibayar';
        
        return `
            <tr>
                <td>${transaction.id}</td>
                <td>${member ? member.name : 'Unknown'}</td>
                <td>${book ? book.title : 'Unknown'}</td>
                <td>${transaction.dueDate}</td>
                <td>Rp ${fine.toLocaleString('id-ID')}</td>
                <td><span class="badge ${transaction.finePaid ? 'badge-success' : 'badge-warning'}">${paidStatus}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="updateDueDate('${transaction.id}')" class="btn btn-primary btn-small">Update Jatuh Tempo</button>
                        ${!transaction.finePaid ? `<button onclick="markPaid('${transaction.id}')" class="btn btn-success btn-small">Tandai Bayar</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.saveFineSettings = function() {
    const finePerWeek = parseInt(document.getElementById('finePerWeek').value);
    const borrowDurationDays = parseInt(document.getElementById('borrowDuration').value);
    
    if (finePerWeek < 0 || borrowDurationDays < 1) {
        showToast('Nilai harus valid', 'error');
        return;
    }
    
    updateFineSettings({
        finePerWeek,
        borrowDurationDays
    });
    
    showToast('Pengaturan denda berhasil disimpan', 'success');
};

window.updateDueDate = function(transactionId) {
    const transaction = getTransactionById(transactionId);
    const newDate = prompt('Masukkan tanggal jatuh tempo baru (YYYY-MM-DD):', transaction.dueDate);
    
    if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        updateTransactionDueDate(transactionId, newDate);
        showToast('Tanggal jatuh tempo berhasil diperbarui', 'success');
        loadFinesManagement();
    } else if (newDate) {
        showToast('Format tanggal tidak valid', 'error');
    }
};

window.markPaid = function(transactionId) {
    if (confirm('Tandai denda sebagai sudah dibayar?')) {
        markFinePaid(transactionId);
        showToast('Denda berhasil ditandai sebagai dibayar', 'success');
        loadFinesManagement();
    }
};

// User Dashboard
function showUserDashboard() {
    showPage('userPage');
    document.getElementById('userName').textContent = currentUser.name;
    showUserTab('catalog');
}

window.showUserTab = function(tabName) {
    // Update tab buttons
    document.querySelectorAll('.user-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    if (tabName === 'catalog') {
        document.getElementById('catalogTab').classList.add('active');
        document.getElementById('mybooksTab').classList.remove('active');
        loadBooksGrid();
    } else if (tabName === 'mybooks') {
        document.getElementById('catalogTab').classList.remove('active');
        document.getElementById('mybooksTab').classList.add('active');
        loadMyBooks();
    }
};

function loadBooksGrid() {
    const books = getBooks();
    const grid = document.getElementById('booksGrid');
    
    if (books.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><p>Belum ada buku tersedia</p></div>';
        return;
    }
    
    grid.innerHTML = books.map(book => `
        <div class="book-card" onclick="showBookDetail('${book.id}')" style="cursor: pointer;">
            <img src="${book.cover}" alt="${book.title}" class="book-cover">
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">oleh ${book.author}</p>
                <p class="book-publisher">penerbit: ${book.publisher}</p>
                <span class="book-genre">${book.genre}</span>
                <p class="book-stock">Stok tersedia: ${book.stock}</p>
                <div class="book-actions">
                    <button onclick="event.stopPropagation(); borrowBook('${book.id}')" class="btn btn-primary btn-small" ${book.stock === 0 ? 'disabled' : ''}>
                        ${book.stock === 0 ? 'Stok Habis' : 'Pinjam'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

window.searchUserBooks = function() {
    const searchTerm = document.getElementById('userBookSearch').value.toLowerCase();
    const genreFilter = document.getElementById('genreFilter').value;
    
    let books = getBooks();
    
    if (searchTerm) {
        books = books.filter(book => book.title.toLowerCase().includes(searchTerm));
    }
    
    if (genreFilter) {
        books = books.filter(book => book.genre === genreFilter);
    }
    
    const grid = document.getElementById('booksGrid');
    if (books.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Tidak ada buku ditemukan</p></div>';
        return;
    }
    
    grid.innerHTML = books.map(book => `
        <div class="book-card" onclick="showBookDetail('${book.id}')" style="cursor: pointer;">
            <img src="${book.cover}" alt="${book.title}" class="book-cover">
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">oleh ${book.author}</p>
                 <p class="book-publisher">penerbit: ${book.publisher}</p>
                <span class="book-genre">${book.genre}</span>
                <p class="book-stock">Stok tersedia: ${book.stock}</p>
                <div class="book-actions">
                    <button onclick="event.stopPropagation(); borrowBook('${book.id}')" class="btn btn-primary btn-small" ${book.stock === 0 ? 'disabled' : ''}>
                        ${book.stock === 0 ? 'Stok Habis' : 'Pinjam'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

window.filterByGenre = function() {
    searchUserBooks();
};

window.borrowBook = function(bookId) {
    const book = getBookById(bookId);
    
    if (book.stock === 0) {
        showToast('Maaf, stok buku habis!', 'error');
        return;
    }
    
    // Check if user has unpaid fines
    const fines = getMemberFines(currentUser.id);
    if (fines.totalFine > 0) {
        showToast(`Anda memiliki denda Rp ${fines.totalFine.toLocaleString('id-ID')} yang belum dibayar. Bayar denda sebelum meminjam buku baru!`, 'error');
        return;
    }
    
    // Check if user already borrowed 3 books
    const activeBorrows = getActiveBorrowsByMember(currentUser.id);
    if (activeBorrows.length >= 3) {
        showToast('Anda sudah meminjam 3 buku. Kembalikan buku terlebih dahulu!', 'error');
        return;
    }
    
    // Check if user already borrowed this book
    if (activeBorrows.find(t => t.bookId === bookId)) {
        showToast('Anda sudah meminjam buku ini!', 'error');
        return;
    }
    
    const transaction = {
        memberId: currentUser.id,
        bookId: bookId
    };
    
    addTransaction(transaction);
    showToast(`Berhasil meminjam "${book.title}"!`, 'success');
    loadBooksGrid();
    
    // Update current user data
    currentUser.borrowedBooks = currentUser.borrowedBooks || [];
    currentUser.borrowedBooks.push(bookId);
};

function loadMyBooks() {
    // Load fines first
    displayUserFines();
    
    const container = document.getElementById('myBooksContainer');
    const activeBorrows = getActiveBorrowsByMember(currentUser.id);
    
    if (activeBorrows.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📖</div><p>Anda belum meminjam buku</p></div>';
        return;
    }
    
    container.innerHTML = activeBorrows.map(transaction => {
        const book = getBookById(transaction.bookId);
        const today = new Date().toISOString().split('T')[0];
        const isOverdue = today > transaction.dueDate;
        const fine = calculateFine(transaction.id);
        
        return `
            <div class="borrowed-book-card" ${isOverdue ? 'style="border-left: 4px solid #ff6b6b;"' : ''}>
                <div class="borrowed-book-info">
                    <h3>${book.title}</h3>
                    <p><strong>Penulis:</strong> ${book.author}</p>
                    <p><strong>Penerbit:</strong> ${book.publisher}</p>
                    <p><strong>Genre:</strong> ${book.genre}</p>
                    <p><strong>Tanggal Pinjam:</strong> ${transaction.borrowDate}</p>
                    <p><strong>Tanggal Jatuh Tempo:</strong> <span style="${isOverdue ? 'color: #ff6b6b; font-weight: bold;' : ''}">${transaction.dueDate}${isOverdue ? ' ⚠️ OVERDUE' : ''}</span></p>
                    ${fine > 0 ? `<p style="color: #ff6b6b;"><strong>❌ Denda: Rp ${fine.toLocaleString('id-ID')}</strong></p>` : ''}
                </div>
                <button onclick="returnBookUser('${transaction.id}')" class="btn btn-success btn-block">
                    Kembalikan Buku
                </button>
            </div>
        `;
    }).join('');
}

function displayUserFines() {
    const finesSection = document.getElementById('finesSection');
    const fines = getMemberFines(currentUser.id);
    
    if (fines.totalFine === 0) {
        finesSection.innerHTML = '';
        return;
    }
    
    finesSection.innerHTML = `
        <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #ff6b6b;">⚠️ Anda Memiliki Denda Tertunggak</h3>
            <p style="margin: 10px 0;"><strong>Total Denda: Rp ${fines.totalFine.toLocaleString('id-ID')}</strong></p>
            <div style="margin-top: 10px;">
                ${fines.unpaidFines.map(fine => `
                    <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 4px;">
                        <p style="margin: 0;"><strong>${fine.bookTitle}</strong></p>
                        <p style="margin: 5px 0; color: #666;">Jatuh Tempo: ${fine.dueDate}</p>
                        <p style="margin: 5px 0;">Denda: <strong>Rp ${fine.fine.toLocaleString('id-ID')}</strong></p>
                    </div>
                `).join('')}
            </div>
            <p style="margin-top: 10px; color: #666; font-size: 0.9em;">💡 Bayar denda sebelum meminjam buku baru</p>
        </div>
    `;
}

window.returnBookUser = function(transactionId) {
    if (confirm('Apakah Anda yakin ingin mengembalikan buku ini?')) {
        const transaction = returnBook(transactionId);
        if (transaction) {
            const book = getBookById(transaction.bookId);
            showToast(`Berhasil mengembalikan "${book.title}"!`, 'success');
            loadMyBooks();
            
            // Update current user data
            if (currentUser.borrowedBooks) {
                currentUser.borrowedBooks = currentUser.borrowedBooks.filter(id => id !== transaction.bookId);
            }
        }
    }
};


// Book Detail Modal
window.showBookDetail = function(bookId) {
    const book = getBookById(bookId);
    if (!book) return;
    
    document.getElementById('bookDetailCover').src = book.cover;
    document.getElementById('bookDetailTitle').textContent = book.title;
    document.getElementById('bookDetailAuthor').textContent = book.author;
    document.getElementById('bookDetailPublisher').textContent = book.publisher;
    document.getElementById('bookDetailGenre').textContent = book.genre;
    document.getElementById('bookDetailISBN').textContent = book.isbn;
    document.getElementById('bookDetailStock').textContent = book.stock;
    document.getElementById('bookDetailDescription').textContent = book.description || 'Tidak ada deskripsi tersedia';
    
    const borrowBtn = document.getElementById('borrowBookBtn');
    borrowBtn.textContent = book.stock === 0 ? 'Stok Habis' : 'Pinjam Buku Ini';
    borrowBtn.disabled = book.stock === 0;
    borrowBtn.dataset.bookId = bookId;
    
    document.getElementById('bookDetailModal').classList.add('active');
};

window.borrowBookFromModal = function() {
    const bookId = document.getElementById('borrowBookBtn').dataset.bookId;
    closeBookDetailModal();
    borrowBook(bookId);
};

window.closeBookDetailModal = function() {
    document.getElementById('bookDetailModal').classList.remove('active');
};

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    showLanding();
});

