import axios from 'axios';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart]
      const stock = await api.get('/stock/' + productId).then(response => response.data);
      const product = await api.get('/products/' + productId).then(response => response.data);
      const productExist = updateCart.find(produto => produto.id === product.id);
      const currentAmount = productExist ? productExist.amount : 0;
      const amount = currentAmount + 1;
      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExist) {
        productExist.amount = amount;
      } else {
        const newProduct = {
          ...product,
          amount: 1
        }
        updateCart.push(newProduct)
      }
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExist = cart.find(produto => produto.id === productId);
      if (!productExist) {
        toast.error('Erro na remoção do produto');
        return;
      }
      const newCart = cart.filter((product) => product.id !== productId)
      const updateCart = [...newCart]
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updateCart = [...cart]

      const stock = await api.get('/stock/' + productId).then(response => response.data);
      let productExist = updateCart.find(produto => produto.id === productId);

      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (amount < 1) {
        return;
      }
      if (productExist) {
        updateCart.forEach(product => {
          if (product.id === productId) {
            product.amount = amount;
          }
          setCart(updateCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
        })
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
