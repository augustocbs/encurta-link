import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('urls')
export class Url {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 2048, unique: true, nullable: false })
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