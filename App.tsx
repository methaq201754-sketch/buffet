import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- الأنواع والبيانات (Types) ---
type Role = 'Admin' | 'Employee';
type Category = 'وجبة الفطور' | 'وجبة الغداء' | 'وجبات أخرى';
type OrderStatus = 'قيد الانتظار' | 'تمت الموافقة' | 'مرفوض';

interface User {
  id: string;
  name: string;
  password: string;
  role: Role;
  allowedBalance: number; // الرصيد المسموح
  usedBalance: number;    // رصيد السحب
}

interface Meal {
  id: string;
  name: string;
  category: Category;
  price: number; // بالريال اليمني
}

interface Order {
  id: string;
  employeeName: string;
  mealName: string;
  category: Category;
  quantity: number;
  totalPrice: number;
  dateTime: string;
  status: OrderStatus;
}

// شعار YCPD المرفق (يمكن استبداله برابط مباشر أو محلي)
const LOGO_URL = 'https://i.ibb.co/L8v8Cvh/ycpd-logo.png'; 

// البيانات الافتراضية الأولية
const INITIAL_USERS: User[] = [
  { id: '1', name: 'ميثاق عبده علي مقبل', password: '111', role: 'Admin', allowedBalance: 100000, usedBalance: 0 },
  { id: '2', name: 'بدر', password: '222', role: 'Employee', allowedBalance: 30000, usedBalance: 0 },
  { id: '3', name: 'سعيد', password: '333', role: 'Employee', allowedBalance: 25000, usedBalance: 0 },
];

const INITIAL_MEALS: Meal[] = [
  { id: 'm1', name: 'وجبة كبدة بالفرن', category: 'وجبة الفطور', price: 2500 },
  { id: 'm2', name: 'صحن فلافل مشكل', category: 'وجبة الفطور', price: 1500 },
  { id: 'm3', name: 'وجبة دجاج مضغوط', category: 'وجبة الغداء', price: 4500 },
  { id: 'm4', name: 'وجبة لحم برم', category: 'وجبة الغداء', price: 6000 },
  { id: 'm5', name: 'عصير طازج مشكل', category: 'وجبات أخرى', price: 1200 },
  { id: 'm6', name: 'شاي حليب / قهوة', category: 'وجبات أخرى', price: 500 },
];

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // تسجيل الدخول
  const [inputName, setInputName] = useState('');
  const [inputPassword, setInputPassword] = useState('');

  // واجهات الموظف
  const [currentScreen, setCurrentScreen] = useState<'main' | 'order_categories' | 'order_form' | 'reports'>('main');
  const [selectedCategory, setSelectedCategory] = useState<Category>('وجبة الفطور');
  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');

  // تحكم المدير
  const [adminTab, setAdminTab] = useState<'orders' | 'meals' | 'employees'>('orders');
  
  // إضافة/تعديل الوجبات
  const [newMealName, setNewMealName] = useState('');
  const [newMealCategory, setNewMealCategory] = useState<Category>('وجبة الفطور');
  const [newMealPrice, setNewMealPrice] = useState('');
  const [editingMealId, setEditingMealId] = useState<string | null>(null);

  // إضافة/تعديل الموظفين
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpBalance, setNewEmpBalance] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<Role>('Employee');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const u = await AsyncStorage.getItem('@ycpd_users');
      const m = await AsyncStorage.getItem('@ycpd_meals');
      const o = await AsyncStorage.getItem('@ycpd_orders');

      setUsers(u ? JSON.parse(u) : INITIAL_USERS);
      setMeals(m ? JSON.parse(m) : INITIAL_MEALS);
      setOrders(o ? JSON.parse(o) : []);
    } catch (e) {
      console.error(e);
    }
  };

  const saveData = async (updatedUsers?: User[], updatedMeals?: Meal[], updatedOrders?: Order[]) => {
    if (updatedUsers) {
      setUsers(updatedUsers);
      await AsyncStorage.setItem('@ycpd_users', JSON.stringify(updatedUsers));
    }
    if (updatedMeals) {
      setMeals(updatedMeals);
      await AsyncStorage.setItem('@ycpd_meals', JSON.stringify(updatedMeals));
    }
    if (updatedOrders) {
      setOrders(updatedOrders);
      await AsyncStorage.setItem('@ycpd_orders', JSON.stringify(updatedOrders));
    }
  };

  // التحية حسب الوقت
  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'صباح الخير' : 'مساء الخير';
  };

  // 1. تسجيل الدخول
  const handleLogin = () => {
    const found = users.find(
      (u) => u.name.trim() === inputName.trim()
    );

    if (!found) {
      Alert.alert('خطأ', 'اسم المستخدم غير موجود');
      return;
    }

    if (found.password !== inputPassword.trim()) {
      Alert.alert('خطأ', 'كلمة المرور غير صحيحة');
      return;
    }

    setCurrentUser(found);
    setInputName('');
    setInputPassword('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('main');
  };

  // 2. إرسال الطلب
  const handleSendOrder = () => {
    if (!currentUser) return;
    const meal = meals.find((m) => m.id === selectedMealId);
    if (!meal) {
      Alert.alert('تنبيه', 'يرجى اختيار الوجبة أولاً');
      return;
    }

    const qty = parseInt(quantity) || 1;
    const totalPrice = meal.price * qty;

    const remaining = currentUser.allowedBalance - currentUser.usedBalance;
    if (totalPrice > remaining) {
      Alert.alert('رصيد غير كافي', 'عذراً، المبلغ المطلوب يتجاوز الرصيد المتبقي المسموح لك.');
      return;
    }

    const newOrder: Order = {
      id: Date.now().toString(),
      employeeName: currentUser.name,
      mealName: meal.name,
      category: selectedCategory,
      quantity: qty,
      totalPrice: totalPrice,
      dateTime: new Date().toLocaleString('ar-YE'),
      status: 'قيد الانتظار',
    };

    const updatedOrders = [newOrder, ...orders];
    
    // تحديث رصيد السحب للموظف
    const updatedUsers = users.map((u) =>
      u.id === currentUser.id ? { ...u, usedBalance: u.usedBalance + totalPrice } : u
    );

    setCurrentUser({ ...currentUser, usedBalance: currentUser.usedBalance + totalPrice });
    saveData(updatedUsers, undefined, updatedOrders);

    Alert.alert('تم بنجاح', 'تم ارسال الطلب بنجاح وهو قيد الموافقة.');
    setCurrentScreen('main');
  };

  // 3. تحكم المدير في الطلبات
  const handleOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    saveData(undefined, undefined, updated);
  };

  // 4. تحكم المدير في الوجبات
  const handleSaveMeal = () => {
    if (!newMealName.trim() || !newMealPrice.trim()) {
      Alert.alert('خطأ', 'يرجى كتابة اسم الوجبة والسعر');
      return;
    }

    if (editingMealId) {
      const updated = meals.map((m) =>
        m.id === editingMealId
          ? { ...m, name: newMealName, category: newMealCategory, price: parseFloat(newMealPrice) }
          : m
      );
      saveData(undefined, updated, undefined);
      setEditingMealId(null);
    } else {
      const newMeal: Meal = {
        id: Date.now().toString(),
        name: newMealName,
        category: newMealCategory,
        price: parseFloat(newMealPrice),
      };
      saveData(undefined, [...meals, newMeal], undefined);
    }

    setNewMealName('');
    setNewMealPrice('');
  };

  // 5. تحكم المدير في الموظفين والرصيد
  const handleSaveEmployee = () => {
    if (!newEmpName.trim() || !newEmpPassword.trim()) {
      Alert.alert('خطأ', 'يرجى كتابة اسم الموظف وكلمة المرور');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: newEmpName.trim(),
      password: newEmpPassword.trim(),
      role: newEmpRole,
      allowedBalance: parseFloat(newEmpBalance) || 0,
      usedBalance: 0,
    };

    saveData([...users, newUser], undefined, undefined);
    setNewEmpName('');
    setNewEmpPassword('');
    setNewEmpBalance('');
    Alert.alert('تم', 'تم إضافة الموظف وتحديد رصيده بنجاح');
  };

  const handleDeleteUser = (id: string) => {
    const updated = users.filter((u) => u.id !== id);
    saveData(updated, undefined, undefined);
  };

  // --- الواجهات ---

  // شاشة الدخول
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.authBox}>
          {/* شعار التطبيق YCPD */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>YCPD</Text>
              <View style={styles.logoSmile} />
            </View>
          </View>

          <Text style={styles.appTitle}>تطبيق البوفية</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>أسم الموظف:</Text>
            <TextInput
              style={styles.input}
              placeholder="ادخل الاسم هنا"
              value={inputName}
              onChangeText={setInputName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور:</Text>
            <TextInput
              style={styles.input}
              placeholder="****"
              secureTextEntry
              value={inputPassword}
              onChangeText={setInputPassword}
            />
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
            <Text style={styles.btnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // لوحة تحكم المدير (ميثاق عبده علي مقبل)
  if (currentUser.role === 'Admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {getGreeting()} يا {currentUser.name}
          </Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>خروج</Text>
          </TouchableOpacity>
        </View>

        {/* أزرار لوحة التحكم الرئيسية */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, adminTab === 'orders' && styles.activeTab]}
            onPress={() => setAdminTab('orders')}
          >
            <Text style={styles.tabBtnText}>لوحة الطلبات</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, adminTab === 'meals' && styles.activeTab]}
            onPress={() => setAdminTab('meals')}
          >
            <Text style={styles.tabBtnText}>إدارة الوجبات والأسعار</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, adminTab === 'employees' && styles.activeTab]}
            onPress={() => setAdminTab('employees')}
          >
            <Text style={styles.tabBtnText}>الموظفين والصلاحيات</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body}>
          {adminTab === 'orders' && (
            <View>
              <Text style={styles.sectionTitle}>جميع الطلبات الواردة</Text>
              {orders.map((o) => (
                <View key={o.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{o.employeeName}</Text>
                  <Text style={styles.cardSub}>
                    {o.category} - {o.mealName} (العدد: {o.quantity})
                  </Text>
                  <Text style={styles.priceText}>
                    المبلغ: {o.totalPrice.toLocaleString()} ريال يمني
                  </Text>
                  <Text style={styles.timeText}>{o.dateTime}</Text>
                  <Text style={styles.statusText}>الحالة الحالية: {o.status}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: '#2e7d32' }]}
                      onPress={() => handleOrderStatus(o.id, 'تمت الموافقة')}
                    >
                      <Text style={styles.btnText}>موافقة</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: '#c62828' }]}
                      onPress={() => handleOrderStatus(o.id, 'مرفوض')}
                    >
                      <Text style={styles.btnText}>رفض</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {adminTab === 'meals' && (
            <View>
              <Text style={styles.sectionTitle}>إضافة / تعديل الوجبات والأسعار</Text>
              <View style={styles.formCard}>
                <TextInput
                  style={styles.input}
                  placeholder="اسم الوجبة"
                  value={newMealName}
                  onChangeText={setNewMealName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="السعر بالريال اليمني"
                  keyboardType="numeric"
                  value={newMealPrice}
                  onChangeText={setNewMealPrice}
                />
                <View style={styles.categoryPicker}>
                  {(['وجبة الفطور', 'وجبة الغداء', 'وجبات أخرى'] as Category[]).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChip,
                        newMealCategory === cat && styles.activeCatChip,
                      ]}
                      onPress={() => setNewMealCategory(cat)}
                    >
                      <Text style={styles.chipText}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveMeal}>
                  <Text style={styles.btnText}>
                    {editingMealId ? 'تعديل الوجبة' : 'إضافة الوجبة'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>قائمة الوجبات والأسعار الحالية</Text>
              {meals.map((m) => (
                <View key={m.id} style={styles.cardRow}>
                  <View>
                    <Text style={styles.cardTitle}>{m.name}</Text>
                    <Text style={styles.cardSub}>{m.category}</Text>
                    <Text style={styles.priceText}>{m.price.toLocaleString()} ريال يمني</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingMealId(m.id);
                      setNewMealName(m.name);
                      setNewMealPrice(m.price.toString());
                      setNewMealCategory(m.category);
                    }}
                  >
                    <Text style={{ color: '#1565c0', fontWeight: 'bold' }}>تعديل</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {adminTab === 'employees' && (
            <View>
              <Text style={styles.sectionTitle}>إضافة موظف وتحديد الرصيد المسموح</Text>
              <View style={styles.formCard}>
                <TextInput
                  style={styles.input}
                  placeholder="اسم الموظف"
                  value={newEmpName}
                  onChangeText={setNewEmpName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="كلمة المرور"
                  value={newEmpPassword}
                  onChangeText={setNewEmpPassword}
                />
                <TextInput
                  style={styles.input}
                  placeholder="الرصيد المسموح (ريال يمني)"
                  keyboardType="numeric"
                  value={newEmpBalance}
                  onChangeText={setNewEmpBalance}
                />
                <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveEmployee}>
                  <Text style={styles.btnText}>إضافة الموظف</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>قائمة الموظفين والأرصدة</Text>
              {users.map((u) => (
                <View key={u.id} style={styles.cardRow}>
                  <View>
                    <Text style={styles.cardTitle}>{u.name} ({u.role})</Text>
                    <Text style={styles.cardSub}>
                      الرصيد المسموح: {u.allowedBalance.toLocaleString()} ر.ي
                    </Text>
                    <Text style={styles.cardSub}>
                      المسحوب: {u.usedBalance.toLocaleString()} ر.ي
                    </Text>
                  </View>
                  {u.role !== 'Admin' && (
                    <TouchableOpacity onPress={() => handleDeleteUser(u.id)}>
                      <Text style={{ color: '#c62828', fontWeight: 'bold' }}>حذف</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // واجهة الموظف العادي
  const selectedCategoryMeals = meals.filter((m) => m.category === selectedCategory);
  const activeMeal = meals.find((m) => m.id === selectedMealId);
  const myOrders = orders.filter((o) => o.employeeName === currentUser.name);

  return (
    <SafeAreaView style={styles.container}>
      {/* شريط التحية العلوي */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {getGreeting()} يا {currentUser.name}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>خروج</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body}>
        {/* لوحة رصيدي */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>لوحة رصيدي</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balLabel}>الرصيد المسموح</Text>
              <Text style={styles.balVal}>{currentUser.allowedBalance.toLocaleString()} ر.ي</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balLabel}>رصيد السحب</Text>
              <Text style={[styles.balVal, { color: '#c62828' }]}>
                {currentUser.usedBalance.toLocaleString()} ر.ي
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balLabel}>المتبقي</Text>
              <Text style={[styles.balVal, { color: '#2e7d32' }]}>
                {(currentUser.allowedBalance - currentUser.usedBalance).toLocaleString()} ر.ي
              </Text>
            </View>
          </View>
        </View>

        {/* التنقل بين الشاشات للموظف */}
        {currentScreen === 'main' && (
          <View style={styles.iconGrid}>
            <TouchableOpacity
              style={styles.mainIconBtn}
              onPress={() => setCurrentScreen('order_categories')}
            >
              <Text style={styles.iconText}>🍔</Text>
              <Text style={styles.iconBtnLabel}>طلب وجبة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainIconBtn}
              onPress={() => setCurrentScreen('reports')}
            >
              <Text style={styles.iconText}>📋</Text>
              <Text style={styles.iconBtnLabel}>تقارير الوجبات</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* شاشة الأيقونات الثلاث للوجبات */}
        {currentScreen === 'order_categories' && (
          <View>
            <Text style={styles.sectionTitle}>اختر نوع الوجبة:</Text>
            {(['وجبة الفطور', 'وجبة الغداء', 'وجبات أخرى'] as Category[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.catMenuBtn}
                onPress={() => {
                  setSelectedCategory(cat);
                  setSelectedMealId('');
                  setCurrentScreen('order_form');
                }}
              >
                <Text style={styles.catMenuText}>{cat}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btnBack} onPress={() => setCurrentScreen('main')}>
              <Text style={styles.btnText}>رجوع للرئيسية</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* شاشة اختيارات الوجبة والكمية والسعر */}
        {currentScreen === 'order_form' && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>{selectedCategory}</Text>

            <Text style={styles.label}>اختر الوجبة:</Text>
            <ScrollView horizontal style={{ marginBottom: 15 }}>
              {selectedCategoryMeals.map((meal) => (
                <TouchableOpacity
                  key={meal.id}
                  style={[
                    styles.catChip,
                    selectedMealId === meal.id && styles.activeCatChip,
                  ]}
                  onPress={() => setSelectedMealId(meal.id)}
                >
                  <Text style={styles.chipText}>{meal.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {activeMeal && (
              <View style={styles.mealDetailBox}>
                <Text style={styles.detailText}>
                  السعر الفردي: {activeMeal.price.toLocaleString()} ريال يمني
                </Text>
              </View>
            )}

            <Text style={styles.label}>الكمية:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            {activeMeal && (
              <Text style={styles.totalPriceText}>
                الإجمالي: {(activeMeal.price * (parseInt(quantity) || 1)).toLocaleString()} ريال يمني
              </Text>
            )}

            <TouchableOpacity style={styles.btnPrimary} onPress={handleSendOrder}>
              <Text style={styles.btnText}>تأكيد وإرسال الطلب</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnBack}
              onPress={() => setCurrentScreen('order_categories')}
            >
              <Text style={styles.btnText}>إلغاء ورجوع</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* قسم تقارير الوجبات */}
        {currentScreen === 'reports' && (
          <View>
            <Text style={styles.sectionTitle}>تقارير وجباتك السابقة</Text>
            {myOrders.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد طلبات مسجلة.</Text>
            ) : (
              myOrders.map((o) => (
                <View key={o.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{o.mealName}</Text>
                  <Text style={styles.cardSub}>
                    التصنيف: {o.category} | الكمية: {o.quantity}
                  </Text>
                  <Text style={styles.priceText}>
                    المبلغ: {o.totalPrice.toLocaleString()} ريال يمني
                  </Text>
                  <Text style={styles.timeText}>{o.dateTime}</Text>
                  <Text style={styles.statusText}>الحالة: {o.status}</Text>
                </View>
              ))
            )}
            <TouchableOpacity style={styles.btnBack} onPress={() => setCurrentScreen('main')}>
              <Text style={styles.btnText}>رجوع للرئيسية</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- الأنماط والتصاميم (Styles) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  authBox: { flex: 1, justifyContent: 'center', padding: 25 },
  logoContainer: { alignItems: 'center', marginBottom: 15 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#212529',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoText: { fontSize: 26, fontWeight: 'bold', color: '#212529' },
  logoSmile: {
    width: 60,
    height: 15,
    borderBottomWidth: 4,
    borderColor: '#d32f2f',
    borderRadius: 10,
    marginTop: -5,
  },
  appTitle: { fontSize: 24, fontWeight: 'bold', color: '#d32f2f', textAlign: 'center', marginBottom: 25 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5, textAlign: 'right' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, textAlign: 'right' },
  btnPrimary: { backgroundColor: '#d32f2f', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnBack: { backgroundColor: '#757575', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  header: { backgroundColor: '#d32f2f', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  logoutText: { color: '#fff', fontSize: 14 },
  body: { padding: 15 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 20 },
  balanceTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'right' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceItem: { alignItems: 'center' },
  balLabel: { fontSize: 12, color: '#666' },
  balVal: { fontSize: 14, fontWeight: 'bold', color: '#1565c0', marginTop: 3 },
  iconGrid: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  mainIconBtn: { backgroundColor: '#fff', padding: 25, borderRadius: 15, alignItems: 'center', width: '45%', borderWidth: 1, borderColor: '#ddd' },
  iconText: { fontSize: 40 },
  iconBtnLabel: { fontSize: 16, fontWeight: 'bold', marginTop: 10, color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10, textAlign: 'right', color: '#212529' },
  catMenuBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginBottom: 10, alignItems: 'center' },
  catMenuText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 20, marginRight: 8 },
  activeCatChip: { backgroundColor: '#d32f2f' },
  chipText: { color: '#333', fontWeight: 'bold' },
  mealDetailBox: { backgroundColor: '#f5f5f5', padding: 10, borderRadius: 6, marginVertical: 10 },
  detailText: { textAlign: 'right', color: '#555' },
  totalPriceText: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32', textAlign: 'right', marginVertical: 10 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#ccc' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderColor: '#d32f2f' },
  tabBtnText: { fontWeight: 'bold', fontSize: 13, color: '#333' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 10 },
  cardRow: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSub: { color: '#666', fontSize: 13, marginTop: 2 },
  priceText: { color: '#2e7d32', fontWeight: 'bold', marginTop: 4 },
  timeText: { color: '#999', fontSize: 11, marginTop: 2 },
  statusText: { fontWeight: 'bold', color: '#e65100', marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  smallBtn: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 5 },
  categoryPicker: { flexDirection: 'row', marginVertical: 10 },
  emptyText: { textAlign: 'center', color: '#999', marginVertical: 20 },
});
