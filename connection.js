// نظام جوجل شيت العام - مجاني بالكامل
class PublicSheetsManager {
    constructor() {
        // استبدل هذا المعرف بمعرف ملفك الفعلي
        this.spreadsheetId = '1YOUR_ACTUAL_SPREADSHEET_ID_HE1lkJn0teL7Bo4ukGso5soYBQhztK5gg-3kFmczlH60aARE';
        this.baseURL = 'https://docs.google.com/spreadsheets/d/1lkJn0teL7Bo4ukGso5soYBQhztK5gg-3kFmczlH60aA/edit?usp=sharing';
    }

    // جلب بيانات من شيت معين
    async getSheetData(sheetName, storeId = null) {
        try {
            const url = `${this.baseURL}/${this.spreadsheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch sheet: ${sheetName}`);
            }
            
            const text = await response.text();
            const data = this.parseGoogleVisualizationData(text);
            
            // فلترة البيانات حسب المتجر إذا طُلب
            if (storeId) {
                return data.filter(item => item.Store_ID === storeId);
            }
            
            return data;
            
        } catch (error) {
            console.error(`Error loading sheet ${sheetName}:`, error);
            return [];
        }
    }

    // تحويل بيانات جوجل إلى JSON
    parseGoogleVisualizationData(text) {
        try {
            // إزالة البادئة من استجابة جوجل
            const jsonStr = text.substring(47).slice(0, -2);
            const data = JSON.parse(jsonStr);
            
            const rows = data.table.rows || [];
            const headers = data.table.cols.map(col => col.label);
            
            return rows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    if (row.c && row.c[index]) {
                        obj[header] = row.c[index].v || '';
                    } else {
                        obj[header] = '';
                    }
                });
                return obj;
            });
        } catch (error) {
            console.error('Error parsing sheet data:', error);
            return [];
        }
    }

    // جلب بيانات المتجر الكاملة
    async loadStoreData(storeId) {
        try {
            const [stores, categories, products] = await Promise.all([
                this.getSheetData('Stores', storeId),
                this.getSheetData('Categories', storeId),
                this.getSheetData('Products', storeId)
            ]);

            return {
                store: this.processStoreData(stores),
                categories: this.processCategoriesData(categories),
                products: this.processProductsData(products)
            };
        } catch (error) {
            console.error('Error loading store data:', error);
            return this.getFallbackData();
        }
    }

    // معالجة بيانات المتجر
    processStoreData(storesData) {
        if (!storesData || storesData.length === 0) {
            return {
                name: 'متجر إلكتروني',
                status: 'active'
            };
        }

        const store = storesData[0];
        return {
            id: store.Store_ID,
            name: store.Store_Name,
            owner: store.Owner_Name,
            phone: store.Phone,
            template: store.Template,
            planType: store.Plan_Type,
            status: store.Status
        };
    }

    // معالجة بيانات التصنيفات
    processCategoriesData(categoriesData) {
        if (!categoriesData || categoriesData.length === 0) {
            return [{ id: 'all', name: 'جميع المنتجات' }];
        }

        return categoriesData.map(item => ({
            id: item.Category_ID,
            name: item.Category_Name,
            description: item.Description,
            image: item.Image,
            status: item.Status
        }));
    }

    // معالجة بيانات المنتجات
    processProductsData(productsData) {
        if (!productsData || productsData.length === 0) return [];

        return productsData
            .filter(item => item.Status === 'active')
            .map(item => ({
                id: item.Product_ID,
                name: item.Product_Name,
                category: item.Category,
                price: parseInt(item.Price) || 0,
                description: item.Description,
                image: item.Image,
                stock: parseInt(item.Stock) || 0,
                status: item.Status
            }));
    }

    // بيانات افتراضية للطوارئ
    getFallbackData() {
        return {
            store: {
                name: 'متجر إلكتروني',
                status: 'active'
            },
            categories: [
                { id: 'all', name: 'جميع المنتجات' }
            ],
            products: []
        };
    }
}

// إنشاء نسخة عامة من المدير
window.googleSheetsManager = new PublicSheetsManager();

// تصدير الدوال للاستخدام العام
window.ShopReadyAPI = {
    loadStoreData: (storeId) => window.googleSheetsManager.loadStoreData(storeId)
};
// تأكد من وجود هذا الكود في connection.js
window.ShopReadyAPI = {
    getSheetData: (sheetName) => window.googleSheetsManager.getSheetData(sheetName),
    loadStoreData: (storeId) => window.googleSheetsManager.loadStoreData(storeId),
    saveOrder: (orderData) => window.googleSheetsManager.saveOrder(orderData)
};