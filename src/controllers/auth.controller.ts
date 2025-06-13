import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';

export const loginCtrl = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Faltan credenciales' });
    }
    const result = await AuthService.login(username, password);
    if (result) {
      res.json({ access_token: result.token, exp: result.exp });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};