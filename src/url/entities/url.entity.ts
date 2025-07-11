import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('urls')
export class Url {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId?: number | null;

  @ManyToOne(() => User, (user) => user.urls, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' }) 
  user: User;

  @Column({ type: 'varchar', length: 767, unique: true, nullable: false })
  originalUrl: string;

  @Column({ type: 'varchar', length: 6, unique: true, nullable: false })
  shortCode: string;

  @Column({ type: 'int', default: 0, nullable: false })
  clicks: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
